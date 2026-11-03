from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from database import engine, get_db, Base
import models
import schemas

# Inicializar y crear tablas en SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ASETI BAR POS API",
    version="1.1.0",
    description="Motor backend completo para POS local: Catálogo ABM, Turnos, Ventas, Usuarios y Cortes."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SEED INICIAL AL ARRANCAR
@app.on_event("startup")
def seed_data():
    db = next(get_db())
    try:
        # 1. Usuarios iniciales
        if db.query(models.Usuario).count() == 0:
            db.add_all([
                models.Usuario(nombre="Emilio Tapia", pin="1234", rol="cajero", cargo="Cajero de Barra"),
                models.Usuario(nombre="Admin General", pin="9999", rol="admin", cargo="Administrador General"),
            ])
            db.commit()

        # 2. Configuración base
        if db.query(models.Configuracion).count() == 0:
            config_items = [
                models.Configuracion(clave="nombre_negocio", valor="ASETI BAR"),
                models.Configuracion(clave="encabezado", valor="Av. Revolución 450, Barra & Grill"),
                models.Configuracion(clave="pie_ticket", valor="¡Gracias por su visita a ASETI BAR!"),
                models.Configuracion(clave="impresora_ip", valor="192.168.1.200"),
                models.Configuracion(clave="impresora_puerto", valor="9100"),
            ]
            db.add_all(config_items)
            db.commit()

        # 3. Catálogo de productos inicial
        if db.query(models.Producto).count() == 0:
            prods = [
                models.Producto(nombre="Corona Extra 355ml", precio=48.0, categoria="Cervezas", emoji="🍺", descripcion="Cerveza clara bien fría"),
                models.Producto(nombre="Victoria Clara 355ml", precio=48.0, categoria="Cervezas", emoji="🍻", descripcion="Sabor tradicional de malta"),
                models.Producto(nombre="Modelo Especial 355ml", precio=52.0, categoria="Cervezas", emoji="🍺", descripcion="Especial de barril o botella"),
                models.Producto(nombre="Tequila Dobel Diamante", precio=140.0, categoria="Destilados", emoji="🥃", descripcion="Copa servida o en las rocas"),
                models.Producto(nombre="Mezcal 400 Conejos Joven", precio=130.0, categoria="Destilados", emoji="🍹", descripcion="Con naranja y sal de gusano"),
                models.Producto(nombre="Whisky JW Black Label", precio=165.0, categoria="Destilados", emoji="🥃", descripcion="Copa doble premium"),
                models.Producto(nombre="Gin Hendrick's Botanic", precio=155.0, categoria="Destilados", emoji="🍸", descripcion="Con tónica y pepino fresco"),
                models.Producto(nombre="Burger Doble ASETI", precio=155.0, categoria="Cocina", emoji="🍔", descripcion="200g res, queso cheddar"),
                models.Producto(nombre="Papas Gajo Trufadas", precio=75.0, categoria="Cocina", emoji="🍟", descripcion="Con parmesano y alioli"),
                models.Producto(nombre="Pizza Pepperoni Artesanal", precio=165.0, categoria="Cocina", emoji="🍕", descripcion="Masa madre y mozzarella"),
                models.Producto(nombre="Alitas Hot BBQ (8 pzas)", precio=140.0, categoria="Cocina", emoji="🍗", descripcion="Salsa ahumada artesanal"),
                models.Producto(nombre="Nachos Arrachera Grill", precio=135.0, categoria="Snacks", emoji="🧀", descripcion="Guacamole y totopos"),
                models.Producto(nombre="Agua Mineral Topo Chico", precio=40.0, categoria="Sin Alcohol", emoji="🥤", descripcion="Vidrio 355ml fría"),
                models.Producto(nombre="Refresco Lata 355ml", precio=35.0, categoria="Sin Alcohol", emoji="🥤", descripcion="Variedad de sabores"),
            ]
            db.add_all(prods)
            db.commit()

        # 4. Turno inicial abierto si no hay ninguno
        if db.query(models.Turno).count() == 0:
            cajero = db.query(models.Usuario).filter_by(rol="cajero").first()
            if cajero:
                db.add(models.Turno(usuario_id=cajero.id, fondo_inicial=1000.0, estado="abierto"))
                db.commit()
    finally:
        db.close()


# ========================================================
# 1. AUTENTICACIÓN POR PIN
# ========================================================
@app.post("/auth/login", response_model=schemas.Usuario, tags=["Autenticación"])
def login_por_pin(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.pin == req.pin).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="PIN Incorrecto")
    return usuario


# ========================================================
# 2. CATÁLOGO ABM (PRODUCTOS)
# ========================================================
@app.get("/catalogo/productos", response_model=List[schemas.Producto], tags=["Catálogo"])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).order_by(models.Producto.categoria, models.Producto.nombre).all()

@app.post("/catalogo/productos", response_model=schemas.Producto, status_code=status.HTTP_201_CREATED, tags=["Catálogo"])
def crear_producto(item: schemas.ProductoCreate, db: Session = Depends(get_db)):
    nuevo = models.Producto(**item.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.put("/catalogo/productos/{producto_id}", response_model=schemas.Producto, tags=["Catálogo"])
def actualizar_producto(producto_id: int, item: schemas.ProductoUpdate, db: Session = Depends(get_db)):
    prod = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(prod, key, value)
    
    db.commit()
    db.refresh(prod)
    return prod

@app.delete("/catalogo/productos/{producto_id}", tags=["Catálogo"])
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    prod = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(prod)
    db.commit()
    return {"message": "Producto eliminado exitosamente"}


# ========================================================
# 3. GESTIÓN DE CAJEROS (USUARIOS)
# ========================================================
@app.get("/usuarios", response_model=List[schemas.Usuario], tags=["Usuarios"])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).order_by(models.Usuario.id).all()

@app.post("/usuarios", response_model=schemas.Usuario, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
def crear_usuario(usr: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Usuario).filter(models.Usuario.pin == usr.pin).first()
    if existente:
        raise HTTPException(status_code=400, detail="Este PIN ya está en uso por otro usuario")
    nuevo = models.Usuario(**usr.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.put("/usuarios/{usuario_id}", response_model=schemas.Usuario, tags=["Usuarios"])
def actualizar_usuario(usuario_id: int, usr: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if usr.pin and usr.pin != u.pin:
        if db.query(models.Usuario).filter(models.Usuario.pin == usr.pin).first():
            raise HTTPException(status_code=400, detail="El PIN ya está en uso")

    for key, value in usr.model_dump(exclude_unset=True).items():
        setattr(u, key, value)

    db.commit()
    db.refresh(u)
    return u

@app.delete("/usuarios/{usuario_id}", tags=["Usuarios"])
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(u)
    db.commit()
    return {"message": "Usuario eliminado"}


# ========================================================
# 4. TURNOS & CORTES X / Z
# ========================================================
@app.get("/turnos/activo", tags=["Turnos"])
def obtener_turno_activo(db: Session = Depends(get_db)):
    turno = db.query(models.Turno).filter(models.Turno.estado == "abierto").order_by(models.Turno.id.desc()).first()
    if not turno:
        return None
    return {
        "id": turno.id,
        "usuario_id": turno.usuario_id,
        "usuario_nombre": turno.usuario.nombre if turno.usuario else "Desconocido",
        "fondo_inicial": turno.fondo_inicial,
        "fecha_apertura": turno.fecha_apertura,
        "estado": turno.estado
    }

@app.post("/turnos/apertura", tags=["Turnos"])
def abrir_turno(ap: schemas.TurnoApertura, db: Session = Depends(get_db)):
    activo = db.query(models.Turno).filter(models.Turno.estado == "abierto").first()
    if activo:
        raise HTTPException(status_code=400, detail="Ya existe un turno activo. Debe cerrar el turno antes de abrir otro.")
    
    nuevo_turno = models.Turno(
        usuario_id=ap.usuario_id,
        fondo_inicial=ap.fondo_inicial,
        estado="abierto"
    )
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)
    return nuevo_turno

@app.get("/turnos/corte_x", tags=["Cortes"])
def generar_corte_x(db: Session = Depends(get_db)):
    """Corte X: Lectura parcial del turno activo."""
    turno = db.query(models.Turno).filter(models.Turno.estado == "abierto").order_by(models.Turno.id.desc()).first()
    if not turno:
        raise HTTPException(status_code=404, detail="No hay turno activo para generar Corte X")

    tickets = db.query(models.Ticket).filter(models.Ticket.turno_id == turno.id).all()
    
    total_efectivo = sum(t.total for t in tickets if t.metodo_pago == "efectivo")
    total_tarjeta = sum(t.total for t in tickets if t.metodo_pago == "tarjeta")
    gran_total = total_efectivo + total_tarjeta

    return {
        "tipo_corte": "CORTE X (Parcial)",
        "turno_id": turno.id,
        "cajero": turno.usuario.nombre if turno.usuario else "N/A",
        "fecha_apertura": turno.fecha_apertura,
        "fecha_lectura": datetime.now(),
        "fondo_inicial": turno.fondo_inicial,
        "total_tickets": len(tickets),
        "total_efectivo": total_efectivo,
        "total_tarjeta": total_tarjeta,
        "total_ventas": gran_total,
        "efectivo_en_caja": turno.fondo_inicial + total_efectivo
    }

@app.post("/turnos/corte_z", tags=["Cortes"])
def generar_corte_z(db: Session = Depends(get_db)):
    """Corte Z: Cierre de turno definitivo y sellado de caja."""
    corte_data = generar_corte_x(db)
    turno = db.query(models.Turno).filter(models.Turno.id == corte_data["turno_id"]).first()
    
    turno.estado = "cerrado"
    turno.fecha_cierre = datetime.now()
    db.commit()

    corte_data["tipo_corte"] = "CORTE Z (Cierre Definitivo)"
    corte_data["fecha_cierre"] = turno.fecha_cierre
    return corte_data


# ========================================================
# 5. VENTAS (REGISTRO DE TICKETS)
# ========================================================
@app.post("/ventas/ticket", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Ventas"])
def registrar_ticket(ticket_data: schemas.TicketCreate, db: Session = Depends(get_db)):
    turno_activo = db.query(models.Turno).filter(models.Turno.estado == "abierto").order_by(models.Turno.id.desc()).first()
    turno_id = ticket_data.turno_id or (turno_activo.id if turno_activo else None)

    nuevo_ticket = models.Ticket(
        total=ticket_data.total,
        metodo_pago=ticket_data.metodo_pago,
        cajero_id=ticket_data.cajero_id,
        turno_id=turno_id
    )
    db.add(nuevo_ticket)
    db.flush()

    for p in ticket_data.partidas:
        partida = models.Partida(
            ticket_id=nuevo_ticket.id,
            producto_id=p.producto_id,
            cantidad=p.cantidad or 1,
            subtotal=p.subtotal
        )
        db.add(partida)

    db.commit()
    db.refresh(nuevo_ticket)
    return nuevo_ticket


# ========================================================
# 6. CONFIGURACIÓN DEL SISTEMA
# ========================================================
@app.get("/configuracion", tags=["Configuración"])
def obtener_configuraciones(db: Session = Depends(get_db)):
    items = db.query(models.Configuracion).all()
    return {item.clave: item.valor for item in items}

@app.post("/configuracion", tags=["Configuración"])
def guardar_configuraciones(config_dict: dict, db: Session = Depends(get_db)):
    for clave, valor in config_dict.items():
        cfg = db.query(models.Configuracion).filter(models.Configuracion.clave == clave).first()
        if cfg:
            cfg.valor = str(valor)
        else:
            db.add(models.Configuracion(clave=clave, valor=str(valor)))
    db.commit()
    return {"message": "Configuración actualizada correctamente"}
