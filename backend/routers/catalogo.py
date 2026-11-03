from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sqlite3
from typing import List, Optional
from database import get_db

router = APIRouter(prefix="/catalogo", tags=["catalogo"])

class ProductoCreate(BaseModel):
    nombre: str
    precio: float
    categoria: str
    color_boton: Optional[str] = "#1A1A1E"

class ProductoResponse(ProductoCreate):
    id: int

@router.get("/productos", response_model=List[ProductoResponse])
def listar_productos(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, nombre, precio, categoria, color_boton FROM productos ORDER BY categoria, nombre")
    rows = cursor.fetchall()
    return [dict(row) for row in rows]

@router.post("/productos", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO productos (nombre, precio, categoria, color_boton) VALUES (?, ?, ?, ?)",
        (producto.nombre, producto.precio, producto.categoria, producto.color_boton)
    )
    db.commit()
    prod_id = cursor.lastrowid
    return {**producto.model_dump(), "id": prod_id}

@router.delete("/productos/{producto_id}")
def eliminar_producto(producto_id: int, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM productos WHERE id = ?", (producto_id,))
    db.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado correctamente"}

