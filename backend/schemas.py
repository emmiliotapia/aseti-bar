from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# ========================================================
# SCHEMAS PYDANTIC - ESTRICTOS CON sqlite-pos-rules.md
# ========================================================

# --- Esquemas de Producto (Catálogo) ---
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    categoria: str
    color_boton: Optional[str] = "#1A1A1E"

class ProductoCreate(ProductoBase):
    pass

class Producto(ProductoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- Esquemas de Partidas ---
class PartidaItem(BaseModel):
    producto_id: int
    subtotal: float

class PartidaResponse(PartidaItem):
    id: int
    ticket_id: int
    model_config = ConfigDict(from_attributes=True)


# --- Esquemas de Tickets ---
class TicketCreate(BaseModel):
    total: float
    metodo_pago: str
    cajero_id: Optional[str] = "cajero_01"
    partidas: List[PartidaItem]

class TicketResponse(BaseModel):
    id: int
    total: float
    fecha_hora: datetime
    metodo_pago: str
    cajero_id: str
    model_config = ConfigDict(from_attributes=True)

