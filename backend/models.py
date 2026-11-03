from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

# ========================================================
# DIRECTIVAS sqlite-pos-rules.md: CERO INVENTARIOS
# ========================================================

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    usuario = Column(String, unique=True, nullable=False, index=True)
    pin = Column(String, nullable=False)
    rol = Column(String, nullable=False) # 'cajero' | 'mesero' | 'admin'
    cargo = Column(String, default="Personal de Servicio", nullable=False)
    activo_hoy = Column(Boolean, default=False, nullable=False) # Asistencia autorizada por admin

    turnos = relationship("Turno", back_populates="usuario")
    asistencias = relationship("Asistencia", back_populates="usuario")


class Asistencia(Base):
    __tablename__ = "asistencias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String, nullable=False) # 'entrada' | 'salida'
    fecha_hora = Column(DateTime, server_default=func.now(), nullable=False)
    autorizado_por = Column(String, default="Admin", nullable=False)

    usuario = relationship("Usuario", back_populates="asistencias")


class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fondo_inicial = Column(Float, nullable=False, default=0.0)
    fecha_apertura = Column(DateTime, server_default=func.now(), nullable=False)
    fecha_cierre = Column(DateTime, nullable=True)
    estado = Column(String, default="abierto", nullable=False) # 'abierto' | 'cerrado'

    usuario = relationship("Usuario", back_populates="turnos")
    tickets = relationship("Ticket", back_populates="turno")


class Configuracion(Base):
    __tablename__ = "configuracion"

    clave = Column(String, primary_key=True, index=True)
    valor = Column(Text, nullable=False)


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    precio = Column(Float, nullable=False)
    categoria = Column(String, nullable=False, index=True)
    color_boton = Column(String, default="#14171E", nullable=False)
    descripcion = Column(String, default="", nullable=False)
    emoji = Column(String, default="🍺", nullable=False)
    imagen_url = Column(Text, default="", nullable=False)

    partidas = relationship("Partida", back_populates="producto")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"), nullable=True)
    total = Column(Float, nullable=False)
    fecha_hora = Column(DateTime, server_default=func.now(), nullable=False)
    metodo_pago = Column(String, nullable=False)
    cajero_id = Column(String, nullable=False)
    mesa = Column(String, default="Mesa 1", nullable=True)
    mesero = Column(String, default="General", nullable=True)

    turno = relationship("Turno", back_populates="tickets")
    partidas = relationship("Partida", back_populates="ticket", cascade="all, delete-orphan")


class CuentaAbierta(Base):
    __tablename__ = "cuentas_abiertas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mesa = Column(String, nullable=False, index=True) # ej: "Mesa 1", "Barra 1", etc.
    mesero = Column(String, nullable=False) # Nombre del mesero a cargo
    cajero = Column(String, nullable=False) # Quién abrió o modificó
    fecha_apertura = Column(DateTime, server_default=func.now(), nullable=False)
    nota = Column(String, default="", nullable=False)
    estado = Column(String, default="abierta", nullable=False) # 'abierta' | 'cerrada'

    partidas = relationship("PartidaCuenta", back_populates="cuenta", cascade="all, delete-orphan")


class PartidaCuenta(Base):
    __tablename__ = "partidas_cuenta"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cuenta_id = Column(Integer, ForeignKey("cuentas_abiertas.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, default=1, nullable=False)
    subtotal = Column(Float, nullable=False)

    cuenta = relationship("CuentaAbierta", back_populates="partidas")
    producto = relationship("Producto")


class Partida(Base):
    __tablename__ = "partidas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, default=1, nullable=False)
    subtotal = Column(Float, nullable=False)

    ticket = relationship("Ticket", back_populates="partidas")
    producto = relationship("Producto", back_populates="partidas")
