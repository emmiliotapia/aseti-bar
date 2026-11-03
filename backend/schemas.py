from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- SCHEMAS DE PRODUCTO (CATÁLOGO ABM) ---
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    categoria: str
    color_boton: Optional[str] = "#14171E"
    descripcion: Optional[str] = ""
    emoji: Optional[str] = "🍺"

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    categoria: Optional[str] = None
    color_boton: Optional[str] = None
    descripcion: Optional[str] = None
    emoji: Optional[str] = None

class Producto(ProductoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE USUARIO (CAJEROS & ROLES) ---
class UsuarioBase(BaseModel):
    nombre: str
    pin: str
    rol: str # 'cajero' | 'admin'
    cargo: Optional[str] = "Personal de Barra"

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    pin: Optional[str] = None
    rol: Optional[str] = None
    cargo: Optional[str] = None

class Usuario(BaseModel):
    id: int
    nombre: str
    pin: str
    rol: str
    cargo: str
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    pin: str


# --- SCHEMAS DE TURNO (CORTE X & CORTE Z) ---
class TurnoApertura(BaseModel):
    usuario_id: int
    fondo_inicial: float

class TurnoCierre(BaseModel):
    turno_id: int

class Turno(BaseModel):
    id: int
    usuario_id: int
    fondo_inicial: float
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime] = None
    estado: str
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE CONFIGURACIÓN ---
class ConfiguracionItem(BaseModel):
    clave: str
    valor: str

class ConfiguracionBulk(BaseModel):
    configuraciones: List[ConfiguracionItem]


# --- SCHEMAS DE PARTIDAS Y TICKETS ---
class PartidaItem(BaseModel):
    producto_id: int
    cantidad: Optional[int] = 1
    subtotal: float

class TicketCreate(BaseModel):
    total: float
    metodo_pago: str
    cajero_id: str
    turno_id: Optional[int] = None
    partidas: List[PartidaItem]

class TicketResponse(BaseModel):
    id: int
    total: float
    fecha_hora: datetime
    metodo_pago: str
    cajero_id: str
    turno_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)
