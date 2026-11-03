from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sqlite3
from typing import List, Optional
from database import get_db

router = APIRouter(prefix="/ventas", tags=["ventas"])

class PartidaInput(BaseModel):
    producto_id: int
    subtotal: float

class TicketCreate(BaseModel):
    total: float
    metodo_pago: str  # Ej. "efectivo", "tarjeta"
    cajero_id: str
    partidas: List[PartidaInput]

@router.post("/ticket")
def registrar_venta(ticket: TicketCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO tickets (total, metodo_pago, cajero_id) VALUES (?, ?, ?)",
            (ticket.total, ticket.metodo_pago, ticket.cajero_id)
        )
        ticket_id = cursor.lastrowid

        for p in ticket.partidas:
            cursor.execute(
                "INSERT INTO partidas (ticket_id, producto_id, subtotal) VALUES (?, ?, ?)",
                (ticket_id, p.producto_id, p.subtotal)
            )

        db.commit()
        return {"status": "ok", "ticket_id": ticket_id, "total": ticket.total}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar venta: {str(e)}")

@router.get("/corte")
def corte_caja(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """
    Regla: Las consultas de corte de caja deben ser un simple SUM(total)
    de la tabla tickets filtrado por rango de fecha/hora.
    """
    cursor = db.cursor()
    query = "SELECT COALESCE(SUM(total), 0) AS gran_total, COUNT(id) AS total_tickets FROM tickets WHERE 1=1"
    params = []

    if fecha_inicio:
        query += " AND fecha_hora >= ?"
        params.append(fecha_inicio)
    if fecha_fin:
        query += " AND fecha_hora <= ?"
        params.append(fecha_fin)

    cursor.execute(query, params)
    resumen = cursor.fetchone()

    # Desglose por método de pago
    query_metodos = "SELECT metodo_pago, COALESCE(SUM(total), 0) as total FROM tickets WHERE 1=1"
    params_metodos = []
    if fecha_inicio:
        query_metodos += " AND fecha_hora >= ?"
        params_metodos.append(fecha_inicio)
    if fecha_fin:
        query_metodos += " AND fecha_hora <= ?"
        params_metodos.append(fecha_fin)
    query_metodos += " GROUP BY metodo_pago"

    cursor.execute(query_metodos, params_metodos)
    por_metodo = [dict(r) for r in cursor.fetchall()]

    return {
        "gran_total": resumen["gran_total"],
        "total_tickets": resumen["total_tickets"],
        "desglose_metodos": por_metodo
    }

