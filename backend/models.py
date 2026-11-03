from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from database import Base

# ========================================================
# DIRECTIVAS sqlite-pos-rules.md:
# 1. CERO INVENTARIOS (No stock, no existencias).
# 2. usuarios (id, nombre, pin, rol).
# 3. turnos (id, usuario_id, fondo_inicial, fecha_apertura, fecha_cierre, estado).
# 4. configuracion (clave, valor).
# 5. productos (id, nombre, precio, categoria, color_boton, descripcion, emoji).
# 6. tickets (id, turno_id, total, fecha_hora, metodo_pago, cajero_id).
# 7. partidas (id, ticket_id, producto_id, subtotal, cantidad).
# ========================================================

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    pin = Column(String, unique=True, nullable=False, index=True)
    rol = Column(String, nullable=False) # 'cajero' | 'admin'
    cargo = Column(String, default="Personal de Barra", nullable=False)

    turnos = relationship("Turno", back_populates="usuario")


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

    partidas = relationship("Partida", back_populates="producto")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"), nullable=True) # opcional si no hay turno estricto
    total = Column(Float, nullable=False)
    fecha_hora = Column(DateTime, server_default=func.now(), nullable=False)
    metodo_pago = Column(String, nullable=False) # 'efectivo' | 'tarjeta'
    cajero_id = Column(String, nullable=False)

    turno = relationship("Turno", back_populates="tickets")
    partidas = relationship("Partida", back_populates="ticket", cascade="all, delete-orphan")


class Partida(Base):
    __tablename__ = "partidas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, default=1, nullable=False)
    subtotal = Column(Float, nullable=False)

    ticket = relationship("Ticket", back_populates="partidas")
    producto = relationship("Producto", back_populates="partidas")
