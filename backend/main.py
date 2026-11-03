from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import engine, get_db, Base
import models
import schemas

# Crear tablas en SQLite respetando los modelos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="POS Local MVP API",
    version="1.0.0",
    description="API ultraligera para cobro rápido y cortes de caja en local."
)

# Configuración de CORS para el cliente Vite / React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed inicial si la base de datos está vacía para probar de inmediato
@app.on_event("startup")
def seed_db_if_empty():
    db = next(get_db())
    try:
        count = db.query(models.Producto).count()
        if count == 0:
            productos_iniciales = [
                models.Producto(nombre="Corona Extra 355ml", precio=48.0, categoria="Cervezas", color_boton="#14171E"),
                models.Producto(nombre="Victoria Clara 355ml", precio=48.0, categoria="Cervezas", color_boton="#14171E"),
                models.Producto(nombre="Modelo Especial 355ml", precio=52.0, categoria="Cervezas", color_boton="#14171E"),
                models.Producto(nombre="Negra Modelo 355ml", precio=55.0, categoria="Cervezas", color_boton="#14171E"),
                models.Producto(nombre="Stella Artois 330ml", precio=65.0, categoria="Cervezas", color_boton="#14171E"),
                models.Producto(nombre="Tequila Dobel Diamante", precio=140.0, categoria="Destilados", color_boton="#14171E"),
                models.Producto(nombre="Mezcal 400 Conejos Joven", precio=130.0, categoria="Destilados", color_boton="#14171E"),
                models.Producto(nombre="Whisky JW Black Label", precio=165.0, categoria="Destilados", color_boton="#14171E"),
                models.Producto(nombre="Gin Hendrick's Tonic", precio=155.0, categoria="Destilados", color_boton="#14171E"),
                models.Producto(nombre="Nachos con Guacamole", precio=110.0, categoria="Cocina", color_boton="#14171E"),
                models.Producto(nombre="Alitas Hot BBQ (8 pzas)", precio=140.0, categoria="Cocina", color_boton="#14171E"),
                models.Producto(nombre="Papas a la Francesa", precio=80.0, categoria="Cocina", color_boton="#14171E"),
                models.Producto(nombre="Agua Mineral Topo Chico", precio=40.0, categoria="Sin Alcohol", color_boton="#14171E"),
                models.Producto(nombre="Refresco Lata 355ml", precio=35.0, categoria="Sin Alcohol", color_boton="#14171E"),
            ]
            db.add_all(productos_iniciales)
            db.commit()
    finally:
        db.close()


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "online", "system": "POS Local MVP (FastAPI + SQLAlchemy)"}


# ========================================================
# ENDPOINTS DE CATÁLOGO (sqlite-pos-rules.md)
# ========================================================
@app.get("/catalogo/productos", response_model=List[schemas.Producto], tags=["Catálogo"])
def listar_catalogo(db: Session = Depends(get_db)):
    """Retorna todos los productos ordenados por categoría y nombre para poblar los botones táctiles."""
    return db.query(models.Producto).order_by(models.Producto.categoria, models.Producto.nombre).all()


@app.post("/catalogo/productos", response_model=schemas.Producto, status_code=status.HTTP_201_CREATED, tags=["Catálogo"])
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo producto en el catálogo táctil."""
    nuevo_producto = models.Producto(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto


# ========================================================
# ENDPOINTS DE VENTAS (sqlite-pos-rules.md)
# ========================================================
@app.post("/ventas/ticket", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Ventas"])
def registrar_ticket(ticket_data: schemas.TicketCreate, db: Session = Depends(get_db)):
    """Registra un ticket de venta y sus partidas correspondientes en una sola transacción."""
    if not ticket_data.partidas:
        raise HTTPException(status_code=400, detail="El ticket debe contener al menos una partida.")

    try:
        nuevo_ticket = models.Ticket(
            total=ticket_data.total,
            metodo_pago=ticket_data.metodo_pago,
            cajero_id=ticket_data.cajero_id or "cajero_01"
        )
        db.add(nuevo_ticket)
        db.flush() # Obtiene el ID asignado al ticket

        for item in ticket_data.partidas:
            partida = models.Partida(
                ticket_id=nuevo_ticket.id,
                producto_id=item.producto_id,
                subtotal=item.subtotal
            )
            db.add(partida)

        db.commit()
        db.refresh(nuevo_ticket)
        return nuevo_ticket
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar venta: {str(e)}")


# ========================================================
# ENDPOINT DE CORTE DE CAJA (sqlite-pos-rules.md regla 4)
# ========================================================
@app.get("/ventas/corte", tags=["Ventas"])
def corte_caja(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Corte de caja basado en SUM(total) de tickets filtrados por rango de fecha/hora.
    """
    query = db.query(
        func.coalesce(func.sum(models.Ticket.total), 0.0).label("gran_total"),
        func.count(models.Ticket.id).label("total_tickets")
    )
    if fecha_inicio:
        query = query.filter(models.Ticket.fecha_hora >= fecha_inicio)
    if fecha_fin:
        query = query.filter(models.Ticket.fecha_hora <= fecha_fin)

    resumen = query.first()

    # Desglose por método de pago
    query_metodos = db.query(
        models.Ticket.metodo_pago,
        func.coalesce(func.sum(models.Ticket.total), 0.0).label("total"),
        func.count(models.Ticket.id).label("tickets")
    )
    if fecha_inicio:
        query_metodos = query_metodos.filter(models.Ticket.fecha_hora >= fecha_inicio)
    if fecha_fin:
        query_metodos = query_metodos.filter(models.Ticket.fecha_hora <= fecha_fin)

    desglose = query_metodos.group_by(models.Ticket.metodo_pago).all()

    return {
        "gran_total": float(resumen.gran_total),
        "total_tickets": int(resumen.total_tickets),
        "desglose": [
            {"metodo_pago": d.metodo_pago, "total": float(d.total), "tickets": int(d.tickets)}
            for d in desglose
        ]
    }
