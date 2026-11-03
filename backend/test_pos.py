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

def test_cuentas_abiertas_flujo():
    # Obtener producto
    res_prods = client.get("/catalogo/productos")
    prod = res_prods.json()[0]

    # 1. Guardar o abrir cuenta en Mesa 4
    payload_cuenta = {
        "mesa": "Mesa 4",
        "mesero": "Emilio Tapia",
        "cajero": "Admin General",
        "nota": "Sin cebolla en alimentos",
        "partidas": [
            {"producto_id": prod["id"], "cantidad": 3, "subtotal": prod["precio"] * 3}
        ]
    }
    res_save = client.post("/cuentas/guardar", json=payload_cuenta)
    assert res_save.status_code == 200, res_save.text
    assert res_save.json()["status"] == "ok"

    # 2. Consultar cuenta por mesa
    res_get = client.get("/cuentas/mesa/Mesa%204")
    assert res_get.status_code == 200
    cuenta = res_get.json()
    assert cuenta is not None
    assert cuenta["mesa"] == "Mesa 4"
    assert cuenta["mesero"] == "Emilio Tapia"
    assert cuenta["total"] == prod["precio"] * 3
    assert len(cuenta["partidas"]) == 1

    # 3. Listar cuentas abiertas
    res_list = client.get("/cuentas")
    assert res_list.status_code == 200
    cuentas = res_list.json()
    assert any(c["mesa"] == "Mesa 4" for c in cuentas)

    # 4. Cobrar la cuenta (se debe cerrar automáticamente)
    payload_ticket = {
        "total": cuenta["total"],
        "metodo_pago": "efectivo",
        "cajero_id": "Admin General",
        "mesa": "Mesa 4",
        "mesero": "Emilio Tapia",
        "cuenta_id": cuenta["id"],
        "partidas": [
            {"producto_id": prod["id"], "cantidad": 3, "subtotal": prod["precio"] * 3}
        ]
    }
    res_ticket = client.post("/ventas/ticket", json=payload_ticket)
    assert res_ticket.status_code == 201

    # 5. Comprobar que ya no está abierta
    res_check = client.get("/cuentas/mesa/Mesa%204")
    assert res_check.status_code == 200
    assert res_check.json() is None

def test_verificar_pin_admin_auditoria():
    # PIN admin válido (9999)
    res_ok = client.post("/auth/verificar-pin-admin", json={"pin": "9999"})
    assert res_ok.status_code == 200
    assert res_ok.json()["autorizado"] is True

    # PIN inválido o de cajero regular (1234)
    res_fail = client.post("/auth/verificar-pin-admin", json={"pin": "1234"})
    assert res_fail.status_code == 401
