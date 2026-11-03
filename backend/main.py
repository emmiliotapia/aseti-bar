from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import shutil
import uuid

from database import engine, get_db, Base
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ASETI BAR POS API",
    version="1.3.0",
    description="Motor backend para POS con control estricto de asistencia por Admin."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Carpeta para almacenar imágenes subidas localmente
UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.on_event("startup")
def seed_data():
    db = next(get_db())
    try:
        # 1. Usuarios iniciales: Admin siempre tiene acceso, cajero/mesero requieren pase de lista
        if db.query(models.Usuario).count() == 0:
            db.add_all([
                models.Usuario(nombre="Admin General", usuario="admin", pin="9999", rol="admin", cargo="Administrador General", activo_hoy=True),
                models.Usuario(nombre="Emilio Tapia", usuario="emilio", pin="1234", rol="cajero", cargo="Cajero de Barra", activo_hoy=True),
                models.Usuario(nombre="Carlos Mesero", usuario="carlos", pin="1111", rol="mesero", cargo="Mesero de Terraza", activo_hoy=False),
            ])
            db.commit()

        # 2. Configuración base
        if db.query(models.Configuracion).count() == 0:
            db.add_all([
                models.Configuracion(clave="nombre_negocio", valor="ASETI BAR"),
                models.Configuracion(clave="encabezado", valor="Av. Revolución 450, Barra & Grill"),
                models.Configuracion(clave="pie_ticket", valor="¡Gracias por su visita a ASETI BAR!"),
                models.Configuracion(clave="impresora_ip", valor="192.168.1.200"),
                models.Configuracion(clave="impresora_puerto", valor="9100"),
            ])
            db.commit()

        # 3. Catálogo con fotos
        if db.query(models.Producto).count() == 0:
            prods = [
                models.Producto(nombre="Corona Extra 355ml", precio=48.0, categoria="Cervezas", emoji="🍺", descripcion="Cerveza clara bien fría", imagen_url="https://images.unsplash.com/photo-1608270191768-450f75745025?w=500&auto=format&fit=crop&q=60"),
                models.Producto(nombre="Victoria Clara 355ml", precio=48.0, categoria="Cervezas", emoji="🍻", descripcion="Sabor tradicional de malta", imagen_url="https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=500&auto=format&fit=crop&q=60"),
                models.Producto(nombre="Tequila Dobel Diamante", precio=140.0, categoria="Destilados", emoji="🥃", descripcion="Copa servida o en las rocas", imagen_url="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&auto=format&fit=crop&q=60"),
                models.Producto(nombre="Mezcal 400 Conejos Joven", precio=130.0, categoria="Destilados", emoji="🍹", descripcion="Con naranja y sal de gusano", imagen_url="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=60"),
                models.Producto(nombre="Burger Doble ASETI", precio=155.0, categoria="Cocina", emoji="🍔", descripcion="200g res, queso cheddar", imagen_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60"),
                models.Producto(nombre="Papas Gajo Trufadas", precio=75.0, categoria="Cocina", emoji="🍟", descripcion="Con parmesano y alioli", imagen_url="https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60"),
                models.Producto(nombre="Pizza Pepperoni Artesanal", precio=165.0, categoria="Cocina", emoji="🍕", descripcion="Masa madre y mozzarella", imagen_url="https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60"),
                models.Producto(nombre="Nachos Arrachera Grill", precio=135.0, categoria="Snacks", emoji="🧀", descripcion="Guacamole y totopos", imagen_url="https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=60"),
            ]
            db.add_all(prods)
            db.commit()
    finally:
        db.close()


# ========================================================
# 1. LOGIN (VERIFICA ASISTENCIA AUTORIZADA POR ADMIN)
# ========================================================
@app.post("/auth/login", response_model=schemas.Usuario, tags=["Autenticación"])
def login_por_usuario_y_pin(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        func.lower(models.Usuario.usuario) == req.usuario.lower(),
        models.Usuario.pin == req.pin
    ).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario o PIN incorrecto.")

    # REGLA: Si es cajero o mesero, el Administrador debe haber marcado su asistencia previa
    if usuario.rol in ["cajero", "mesero"] and not usuario.activo_hoy:
        raise HTTPException(
            status_code=403, 
            detail=f"Acceso bloqueado: {usuario.nombre} no tiene asistencia autorizada por el Administrador hoy."
        )

    return usuario

@app.post("/auth/verificar-pin-admin", tags=["Autenticación"])
def verificar_pin_admin(datos: dict, db: Session = Depends(get_db)):
    """Verifica si el PIN proporcionado pertenece a un usuario con rol de Administrador para autorizar cancelaciones/borrados."""
    pin = datos.get("pin", "")
    admin = db.query(models.Usuario).filter(
        models.Usuario.rol == "admin",
        models.Usuario.pin == pin
    ).first()

    if not admin:
        raise HTTPException(status_code=401, detail="PIN de Administrador inválido o no autorizado")

    return {
        "status": "ok",
        "autorizado": True,
        "admin_nombre": admin.nombre,
        "mensaje": f"Acción autorizada por {admin.nombre}"
    }


# ========================================================
# 2. CONTROL DE ASISTENCIA POR EL ADMINISTRADOR
# ========================================================
@app.post("/asistencia/autorizar", tags=["Asistencia"])
def autorizar_asistencia_por_admin(datos: schemas.AsistenciaAdminToggle, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == datos.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.activo_hoy = datos.autorizar
    tipo_registro = "entrada" if datos.autorizar else "salida"

    registro = models.Asistencia(
        usuario_id=usuario.id,
        tipo=tipo_registro,
        autorizado_por=datos.autorizado_por or "Admin"
    )
    db.add(registro)
    db.commit()
    db.refresh(usuario)

    estado_str = "Habilitado para ingresar al POS" if datos.autorizar else "Deshabilitado (Salida marcada)"
    return {
        "status": "ok",
        "mensaje": f"{usuario.nombre} ha sido {estado_str}.",
        "usuario": usuario
    }

@app.get("/asistencia/historial", tags=["Asistencia"])
def ver_asistencias(db: Session = Depends(get_db)):
    registros = db.query(models.Asistencia).order_by(models.Asistencia.id.desc()).limit(50).all()
    return [
        {
            "id": r.id,
            "usuario": r.usuario.nombre if r.usuario else "Desconocido",
            "tipo": r.tipo,
            "autorizado_por": r.autorizado_por,
            "fecha_hora": r.fecha_hora
        }
        for r in registros
    ]


# ========================================================
# 3. CATÁLOGO ABM (FOTOS Y EDICIÓN)
# ========================================================
@app.post("/catalogo/upload-foto", tags=["Catálogo"])
async def subir_foto_producto(file: UploadFile = File(...)):
    """Permite subir una imagen local (PNG, JPG, WEBP) y retorna su URL estática."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo subido debe ser una imagen válida.")
    
    ext = Path(file.filename).suffix or ".jpg"
    nombre_archivo = f"{uuid.uuid4().hex}{ext}"
    destino = UPLOADS_DIR / nombre_archivo

    with open(destino, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    url_foto = f"http://127.0.0.1:8000/uploads/{nombre_archivo}"
    return {"url": url_foto}

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
# 4. TURNOS & FONDO INICIAL & CORTES
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
        raise HTTPException(status_code=400, detail="Ya existe un turno activo. Debe cerrarlo primero.")
    
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
    turno = db.query(models.Turno).filter(models.Turno.estado == "abierto").order_by(models.Turno.id.desc()).first()
    if not turno:
        raise HTTPException(status_code=404, detail="No hay turno activo")

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
    corte_data = generar_corte_x(db)
    turno = db.query(models.Turno).filter(models.Turno.id == corte_data["turno_id"]).first()
    turno.estado = "cerrado"
    turno.fecha_cierre = datetime.now()
    db.commit()
    corte_data["tipo_corte"] = "CORTE Z (Cierre Definitivo)"
    corte_data["fecha_cierre"] = turno.fecha_cierre
    return corte_data


# ========================================================
# 5. REPORTES DE VENTAS
# ========================================================
@app.get("/reportes/ventas", tags=["Reportes"])
def reporte_ventas_general(db: Session = Depends(get_db)):
    total_acumulado = db.query(func.coalesce(func.sum(models.Ticket.total), 0.0)).scalar()
    total_tickets = db.query(func.count(models.Ticket.id)).scalar()

    por_metodo = db.query(
        models.Ticket.metodo_pago,
        func.sum(models.Ticket.total).label("total"),
        func.count(models.Ticket.id).label("cantidad")
    ).group_by(models.Ticket.metodo_pago).all()

    top_prods = db.query(
        models.Producto.nombre,
        models.Producto.emoji,
        func.sum(models.Partida.cantidad).label("unidades"),
        func.sum(models.Partida.subtotal).label("monto")
    ).join(models.Partida, models.Partida.producto_id == models.Producto.id)\
     .group_by(models.Producto.id)\
     .order_by(func.sum(models.Partida.cantidad).desc())\
     .limit(5).all()

    ultimos_tickets = db.query(models.Ticket).order_by(models.Ticket.id.desc()).limit(10).all()

    return {
        "gran_total": total_acumulado,
        "total_tickets": total_tickets,
        "desglose_metodos": [
            {"metodo": m[0], "total": float(m[1]), "cantidad": m[2]} for m in por_metodo
        ],
        "top_productos": [
            {"nombre": tp[0], "emoji": tp[1], "unidades": tp[2], "monto": float(tp[3])} for tp in top_prods
        ],
        "ultimos_tickets": [
            {
                "id": t.id,
                "total": t.total,
                "fecha": t.fecha_hora,
                "metodo": t.metodo_pago,
                "cajero": t.cajero_id
            } for t in ultimos_tickets
        ]
    }


# ========================================================
# 6. CUENTAS ABIERTAS (COMANDA POR MESA Y MESERO)
# ========================================================
@app.get("/cuentas", response_model=List[schemas.CuentaDetalleResponse], tags=["Cuentas"])
def listar_cuentas_abiertas(db: Session = Depends(get_db)):
    cuentas = db.query(models.CuentaAbierta).filter(models.CuentaAbierta.estado == "abierta").order_by(models.CuentaAbierta.id.desc()).all()
    resultado = []
    for c in cuentas:
        partidas_dto = []
        total_cuenta = 0.0
        for p in c.partidas:
            prod_nombre = p.producto.nombre if p.producto else "Producto"
            prod_precio = p.producto.precio if p.producto else (p.subtotal / p.cantidad if p.cantidad else 0.0)
            partidas_dto.append({
                "id": p.id,
                "producto_id": p.producto_id,
                "nombre": prod_nombre,
                "precio": prod_precio,
                "cantidad": p.cantidad,
                "subtotal": p.subtotal
            })
            total_cuenta += p.subtotal
        
        resultado.append({
            "id": c.id,
            "mesa": c.mesa,
            "mesero": c.mesero,
            "cajero": c.cajero,
            "fecha_apertura": c.fecha_apertura,
            "nota": c.nota or "",
            "estado": c.estado,
            "total": total_cuenta,
            "partidas": partidas_dto
        })
    return resultado

@app.get("/cuentas/mesa/{mesa}", response_model=Optional[schemas.CuentaDetalleResponse], tags=["Cuentas"])
def obtener_cuenta_por_mesa(mesa: str, db: Session = Depends(get_db)):
    c = db.query(models.CuentaAbierta).filter(
        models.CuentaAbierta.mesa == mesa,
        models.CuentaAbierta.estado == "abierta"
    ).first()
    if not c:
        return None
    
    partidas_dto = []
    total_cuenta = 0.0
    for p in c.partidas:
        prod_nombre = p.producto.nombre if p.producto else "Producto"
        prod_precio = p.producto.precio if p.producto else (p.subtotal / p.cantidad if p.cantidad else 0.0)
        partidas_dto.append({
            "id": p.id,
            "producto_id": p.producto_id,
            "nombre": prod_nombre,
            "precio": prod_precio,
            "cantidad": p.cantidad,
            "subtotal": p.subtotal
        })
        total_cuenta += p.subtotal
    
    return {
        "id": c.id,
        "mesa": c.mesa,
        "mesero": c.mesero,
        "cajero": c.cajero,
        "fecha_apertura": c.fecha_apertura,
        "nota": c.nota or "",
        "estado": c.estado,
        "total": total_cuenta,
        "partidas": partidas_dto
    }

@app.post("/cuentas/guardar", tags=["Cuentas"])
def guardar_o_actualizar_cuenta(req: schemas.CuentaGuardarRequest, db: Session = Depends(get_db)):
    """Abre una nueva cuenta para la mesa o actualiza la cuenta abierta existente."""
    cuenta = db.query(models.CuentaAbierta).filter(
        models.CuentaAbierta.mesa == req.mesa,
        models.CuentaAbierta.estado == "abierta"
    ).first()

    if not cuenta:
        cuenta = models.CuentaAbierta(
            mesa=req.mesa,
            mesero=req.mesero,
            cajero=req.cajero,
            nota=req.nota or "",
            estado="abierta"
        )
        db.add(cuenta)
        db.flush()
    else:
        cuenta.mesero = req.mesero
        cuenta.cajero = req.cajero
        cuenta.nota = req.nota or ""
        # Reemplazar partidas anteriores con la orden actualizada
        db.query(models.PartidaCuenta).filter(models.PartidaCuenta.cuenta_id == cuenta.id).delete()

    for p in req.partidas:
        nueva_partida = models.PartidaCuenta(
            cuenta_id=cuenta.id,
            producto_id=p.producto_id,
            cantidad=p.cantidad or 1,
            subtotal=p.subtotal
        )
        db.add(nueva_partida)

    db.commit()
    db.refresh(cuenta)
    return {"status": "ok", "cuenta_id": cuenta.id, "mensaje": f"Cuenta de {cuenta.mesa} guardada con éxito"}

@app.delete("/cuentas/{cuenta_id}", tags=["Cuentas"])
def cancelar_cuenta(cuenta_id: int, db: Session = Depends(get_db)):
    cuenta = db.query(models.CuentaAbierta).filter(models.CuentaAbierta.id == cuenta_id).first()
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    db.delete(cuenta)
    db.commit()
    return {"message": "Cuenta cancelada exitosamente"}


# ========================================================
# 7. VENTAS (COBRO Y CIERRE DE CUENTA)
# ========================================================
@app.post("/ventas/ticket", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Ventas"])
def registrar_ticket(ticket_data: schemas.TicketCreate, db: Session = Depends(get_db)):
    turno_activo = db.query(models.Turno).filter(models.Turno.estado == "abierto").order_by(models.Turno.id.desc()).first()
    turno_id = ticket_data.turno_id or (turno_activo.id if turno_activo else None)

    nuevo_ticket = models.Ticket(
        total=ticket_data.total,
        metodo_pago=ticket_data.metodo_pago,
        cajero_id=ticket_data.cajero_id,
        turno_id=turno_id,
        mesa=ticket_data.mesa or "Mesa 1",
        mesero=ticket_data.mesero or "General"
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

    # Si vino ligado a una cuenta abierta o existe una cuenta abierta para esta mesa, cerrarla
    if ticket_data.cuenta_id:
        cuenta = db.query(models.CuentaAbierta).filter(models.CuentaAbierta.id == ticket_data.cuenta_id).first()
        if cuenta:
            cuenta.estado = "cerrada"
    elif ticket_data.mesa:
        cuenta = db.query(models.CuentaAbierta).filter(
            models.CuentaAbierta.mesa == ticket_data.mesa,
            models.CuentaAbierta.estado == "abierta"
        ).first()
        if cuenta:
            cuenta.estado = "cerrada"

    db.commit()
    db.refresh(nuevo_ticket)
    return nuevo_ticket


# ========================================================
# 7. USUARIOS
# ========================================================
@app.get("/usuarios", response_model=List[schemas.Usuario], tags=["Usuarios"])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).order_by(models.Usuario.id).all()

@app.post("/usuarios", response_model=schemas.Usuario, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
def crear_usuario(usr: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Usuario).filter(models.Usuario.usuario == usr.usuario.lower()).first()
    if existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado.")
    nuevo = models.Usuario(
        nombre=usr.nombre,
        usuario=usr.usuario.lower(),
        pin=usr.pin,
        rol=usr.rol,
        cargo=usr.cargo or "Personal de Servicio",
        activo_hoy=False # Por defecto requiere que el admin le dé pase de lista
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@app.delete("/usuarios/{usuario_id}", tags=["Usuarios"])
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(u)
    db.commit()
    return {"message": "Usuario eliminado"}


# ========================================================
# 8. CONFIGURACIÓN
# ========================================================
@app.get("/configuracion", tags=["Configuración"])
def obtener_config(db: Session = Depends(get_db)):
    items = db.query(models.Configuracion).all()
    return {item.clave: item.valor for item in items}

@app.post("/configuracion", tags=["Configuración"])
def guardar_config(config_dict: dict, db: Session = Depends(get_db)):
    for clave, valor in config_dict.items():
        cfg = db.query(models.Configuracion).filter(models.Configuracion.clave == clave).first()
        if cfg:
            cfg.valor = str(valor)
        else:
            db.add(models.Configuracion(clave=clave, valor=str(valor)))
    db.commit()
    return {"message": "Configuración guardada"}
