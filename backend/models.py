from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base

# ========================================================
# REGLA sqlite-pos-rules.md:
# 1. Prohibido crear columnas de stock o tablas de inventario.
# 2. Catálogo: id, nombre, precio, categoria, color_boton.
# 3. Transaccionales: tickets y partidas.
# ========================================================

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    precio = Column(Float, nullable=False)
    categoria = Column(String, nullable=False, index=True)
    color_boton = Column(String, default="#1A1A1E", nullable=False)

    partidas = relationship("Partida", back_populates="producto")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    total = Column(Float, nullable=False)
    fecha_hora = Column(DateTime, server_default=func.now(), nullable=False)
    metodo_pago = Column(String, nullable=False) # 'efectivo', 'tarjeta'
    cajero_id = Column(String, default="cajero_01", nullable=False)

    partidas = relationship("Partida", back_populates="ticket", cascade="all, delete-orphan")


class Partida(Base):
    __tablename__ = "partidas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    subtotal = Column(Float, nullable=False)

    ticket = relationship("Ticket", back_populates="partidas")
    producto = relationship("Producto", back_populates="partidas")

