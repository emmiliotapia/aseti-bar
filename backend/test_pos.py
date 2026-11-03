import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_auth_login_admin():
    # Login Admin General
    res = client.post("/auth/login", json={"usuario": "admin", "pin": "9999"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["rol"] == "admin"
    assert data["nombre"] == "Admin General"

def test_auth_login_cajero_activo():
    # Login Cajero Emilio (activo_hoy=True por seed)
    res = client.post("/auth/login", json={"usuario": "emilio", "pin": "1234"})
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["rol"] == "cajero"

def test_auth_login_bloqueado_sin_asistencia():
    # Carlos Mesero (activo_hoy=False)
    res = client.post("/auth/login", json={"usuario": "carlos", "pin": "1111"})
    assert res.status_code == 403, "Debe estar bloqueado si no tiene asistencia"

def test_catalogo_productos():
    res = client.get("/catalogo/productos")
    assert res.status_code == 200
    prods = res.json()
    assert isinstance(prods, list)
    assert len(prods) > 0
    assert "nombre" in prods[0]
    assert "precio" in prods[0]

def test_flujo_venta_y_ticket():
    # Obtener productos
    res_prods = client.get("/catalogo/productos")
    prods = res_prods.json()
    prod = prods[0]

    # Verificar o crear turno activo para la prueba
    res_turno = client.get("/turnos/activo")
    turno = res_turno.json()
    if not turno:
        res_ap = client.post("/turnos/apertura", json={"usuario_id": 1, "fondo_inicial": 500.0})
        assert res_ap.status_code == 200
        turno = client.get("/turnos/activo").json()

    turno_id = turno["id"]

    # Registrar venta con tarjeta
    payload = {
        "total": prod["precio"] * 2,
        "metodo_pago": "tarjeta",
        "cajero_id": "Emilio Tapia",
        "turno_id": turno_id,
        "partidas": [
            {
                "producto_id": prod["id"],
                "cantidad": 2,
                "subtotal": prod["precio"] * 2
            }
        ]
    }
    res_ticket = client.post("/ventas/ticket", json=payload)
    assert res_ticket.status_code == 201, res_ticket.text
    ticket = res_ticket.json()
    assert ticket["total"] == prod["precio"] * 2
    assert ticket["metodo_pago"] == "tarjeta"

def test_corte_x():
    res = client.get("/turnos/corte_x")
    assert res.status_code == 200
    corte = res.json()
    assert "tipo_corte" in corte
    assert corte["tipo_corte"].startswith("CORTE X")
    assert "total_ventas" in corte
    assert "efectivo_en_caja" in corte

def test_reporte_ventas():
    res = client.get("/reportes/ventas")
    assert res.status_code == 200
    rep = res.json()
    assert "gran_total" in rep
    assert "total_tickets" in rep
    assert "desglose_metodos" in rep
