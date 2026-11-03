from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

# --- SCHEMAS DE PRODUCTO ---
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    categoria: str
    color_boton: Optional[str] = "#14171E"
    descripcion: Optional[str] = ""
    emoji: Optional[str] = "🍺"
    imagen_url: Optional[str] = ""

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    categoria: Optional[str] = None
    color_boton: Optional[str] = None
    descripcion: Optional[str] = None
    emoji: Optional[str] = None
    imagen_url: Optional[str] = None

class Producto(ProductoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE USUARIO ---
class UsuarioBase(BaseModel):
    nombre: str
    usuario: str
    pin: str
    rol: str
    cargo: Optional[str] = "Personal de Servicio"
    activo_hoy: Optional[bool] = False

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    usuario: Optional[str] = None
    pin: Optional[str] = None
    rol: Optional[str] = None
    cargo: Optional[str] = None
    activo_hoy: Optional[bool] = None

class Usuario(BaseModel):
    id: int
    nombre: str
    usuario: str
    pin: str
    rol: str
    cargo: str
    activo_hoy: bool
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    usuario: str
    pin: str


# --- SCHEMAS DE ASISTENCIA ---
class AsistenciaAdminToggle(BaseModel):
    usuario_id: int
    autorizar: bool
    autorizado_por: Optional[str] = "Admin"

class AsistenciaResponse(BaseModel):
    id: int
    usuario_id: int
    tipo: str
    fecha_hora: datetime
    autorizado_por: str
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE TURNO ---
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
    mesa: Optional[str] = "Mesa 1"
    mesero: Optional[str] = "General"
    cuenta_id: Optional[int] = None
    partidas: List[PartidaItem]

class TicketResponse(BaseModel):
    id: int
    total: float
    fecha_hora: datetime
    metodo_pago: str
    cajero_id: str
    turno_id: Optional[int] = None
    mesa: Optional[str] = None
    mesero: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# --- SCHEMAS DE CUENTAS ABIERTAS ---
class PartidaCuentaDetalle(BaseModel):
    id: int
    producto_id: int
    nombre: str
    precio: float
    cantidad: int
    subtotal: float

class CuentaGuardarRequest(BaseModel):
    mesa: str
    mesero: str
    cajero: str
    nota: Optional[str] = ""
    partidas: List[PartidaItem]

class CuentaDetalleResponse(BaseModel):
    id: int
    mesa: str
    mesero: str
    cajero: str
    fecha_apertura: datetime
    nota: str
    estado: str
    total: float
    partidas: List[PartidaCuentaDetalle]
