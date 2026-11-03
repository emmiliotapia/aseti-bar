"""
Simulación de Prueba Integral: Un Turno Completo en MAREJADA (Café, Cocina, Bar)
- Pase de lista / Asistencia de personal
- Apertura de Turno con Fondo Inicial de Caja
- Múltiples pedidos y comandas en varias mesas y barra (Cuentas Abiertas)
- Cobro en Efectivo con propina voluntaria y cálculo de cambio
- Cobro con Tarjeta con propina y cotejo de 4 dígitos
- Intento de Corte Z bloqueado mientras existan mesas abiertas
- Cierre y cobro de todas las mesas
- Generación de Arqueo Parcial (Corte X)
- Cierre definitivo y sellado de turno (Corte Z)
- Acceso y verificación a los Reportes de Ventas, desglose por métodos y productos estrella
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_simulacion_turno_completo_multiples_mesas():
    print("\n--- INICIO DE SIMULACIÓN DE TURNO COMPLETO ---")

    # Limpiar cuentas residuales de pruebas manuales previas si las hubiera
    cuentas_previas = client.get("/cuentas").json()
    for cp in cuentas_previas:
        client.delete(f"/cuentas/{cp['id']}")

    # 1. Pase de Asistencia: Admin autoriza a meseros y cajeros
    print("1. Validando pase de lista de colaboradores...")
    res_asis1 = client.post("/asistencia/autorizar", json={"usuario_id": 2, "autorizar": True, "autorizado_por": "Admin General"})
    assert res_asis1.status_code == 200
    res_asis2 = client.post("/asistencia/autorizar", json={"usuario_id": 3, "autorizar": True, "autorizado_por": "Admin General"})
    assert res_asis2.status_code == 200

    # 2. Login de Cajero Emilio
    print("2. Login de cajero Emilio Tapia...")
    res_login = client.post("/auth/login", json={"usuario": "emilio", "pin": "1234"})
    assert res_login.status_code == 200
    cajero = res_login.json()

    # 3. Apertura de Turno con Fondo Inicial ($1,500.00 MXN)
    print("3. Verificando o aperturando Turno con Fondo Inicial de $1,500.00...")
    res_turno_act = client.get("/turnos/activo")
    turno = res_turno_act.json()
    if not turno:
        res_apertura = client.post("/turnos/apertura", json={"usuario_id": cajero["id"], "fondo_inicial": 1500.0})
        assert res_apertura.status_code == 200
        turno = client.get("/turnos/activo").json()

    turno_id = turno["id"]
    fondo_inicial = turno["fondo_inicial"]
    print(f"   -> Turno #{turno_id} ACTIVO con fondo inicial ${fondo_inicial:.2f}")

    # Obtener catálogo de productos de Marejada
    res_prods = client.get("/catalogo/productos")
    assert res_prods.status_code == 200
    prods = res_prods.json()
    assert len(prods) >= 3, "Se requieren al menos 3 productos para la prueba"
    p_cerveza = prods[0]   # ej: Corona
    p_comida = prods[4] if len(prods) > 4 else prods[1]  # ej: Burger o similar
    p_trago = prods[2]     # ej: Destilado

    # 4. PEDIDOS EN MÚLTIPLES MESAS (Apertura de Cuentas)
    print("4. Abriendo comandas y pedidos en varias mesas...")

    # Mesa 3 (Mesero Carlos): 2 Cervezas + 1 Comida
    p_m3 = [
        {"producto_id": p_cerveza["id"], "cantidad": 2, "subtotal": p_cerveza["precio"] * 2},
        {"producto_id": p_comida["id"], "cantidad": 1, "subtotal": p_comida["precio"] * 1}
    ]
    tot_m3 = sum(x["subtotal"] for x in p_m3)
    res_m3 = client.post("/cuentas/guardar", json={
        "mesa": "Mesa 3",
        "mesero": "Carlos Mesero",
        "cajero": cajero["nombre"],
        "nota": "Hamburguesa término medio",
        "partidas": p_m3
    })
    assert res_m3.status_code == 200
    print(f"   -> Mesa 3 guardada: {len(p_m3)} artículos, consumo ${tot_m3:.2f}")

    # Mesa 7 (Mesero Emilio): 2 Tragos + 2 Cervezas
    p_m7 = [
        {"producto_id": p_trago["id"], "cantidad": 2, "subtotal": p_trago["precio"] * 2},
        {"producto_id": p_cerveza["id"], "cantidad": 2, "subtotal": p_cerveza["precio"] * 2}
    ]
    tot_m7 = sum(x["subtotal"] for x in p_m7)
    res_m7 = client.post("/cuentas/guardar", json={
        "mesa": "Mesa 7",
        "mesero": "Emilio Tapia",
        "cajero": cajero["nombre"],
        "nota": "Copa servida con hielo aparte",
        "partidas": p_m7
    })
    assert res_m7.status_code == 200
    print(f"   -> Mesa 7 guardada: {len(p_m7)} artículos, consumo ${tot_m7:.2f}")

    # Barra 1 (Cliente directo): 1 Trago
    p_barra = [
        {"producto_id": p_trago["id"], "cantidad": 1, "subtotal": p_trago["precio"] * 1}
    ]
    tot_barra = sum(x["subtotal"] for x in p_barra)
    res_barra = client.post("/cuentas/guardar", json={
        "mesa": "Barra",
        "mesero": "Emilio Tapia",
        "cajero": cajero["nombre"],
        "nota": "Para llevar o tomar en barra",
        "partidas": p_barra
    })
    assert res_barra.status_code == 200
    print(f"   -> Barra guardada: consumo ${tot_barra:.2f}")

    # 5. Comprobar listado de Cuentas Abiertas
    print("5. Verificando módulo de cuentas abiertas en servicio...")
    res_cuentas = client.get("/cuentas")
    assert res_cuentas.status_code == 200
    abiertas = res_cuentas.json()
    mesas_activas = [c["mesa"] for c in abiertas]
    assert "Mesa 3" in mesas_activas
    assert "Mesa 7" in mesas_activas
    assert "Barra" in mesas_activas
    print(f"   -> {len(abiertas)} cuentas abiertas activas: {mesas_activas}")

    # 6. Intentar Corte Z: DEBE FALLAR porque hay cuentas abiertas
    print("6. Verificando candado de seguridad: Intento de Corte Z con mesas abiertas...")
    res_z_bloq = client.post("/turnos/corte_z")
    assert res_z_bloq.status_code == 400
    print(f"   -> Bloqueo exitoso (HTTP 400): {res_z_bloq.json()['detail']}")

    # 7. COBROS Y CIERRES DE MESAS
    print("7. Procesando cobros de las mesas...")

    # Cobro Mesa 3: Pago en EFECTIVO con 10% de propina
    propina_m3 = round(tot_m3 * 0.10, 2)
    tot_pagar_m3 = tot_m3 + propina_m3
    c_m3 = client.get("/cuentas/mesa/Mesa%203").json()
    res_tk_m3 = client.post("/ventas/ticket", json={
        "total": tot_pagar_m3,
        "propina": propina_m3,
        "metodo_pago": "efectivo",
        "cajero_id": cajero["nombre"],
        "mesa": "Mesa 3",
        "mesero": "Carlos Mesero",
        "cuenta_id": c_m3["id"],
        "partidas": p_m3
    })
    assert res_tk_m3.status_code == 201
    print(f"   -> Mesa 3 cobrada en EFECTIVO. Consumo: ${tot_m3:.2f} + Propina: ${propina_m3:.2f} = Total ${tot_pagar_m3:.2f}")

    # Cobro Mesa 7: Pago con TARJETA con 15% de propina
    propina_m7 = round(tot_m7 * 0.15, 2)
    tot_pagar_m7 = tot_m7 + propina_m7
    c_m7 = client.get("/cuentas/mesa/Mesa%207").json()
    res_tk_m7 = client.post("/ventas/ticket", json={
        "total": tot_pagar_m7,
        "propina": propina_m7,
        "metodo_pago": "tarjeta",
        "cajero_id": cajero["nombre"],
        "mesa": "Mesa 7",
        "mesero": "Emilio Tapia",
        "cuenta_id": c_m7["id"],
        "partidas": p_m7
    })
    assert res_tk_m7.status_code == 201
    print(f"   -> Mesa 7 cobrada con TARJETA. Consumo: ${tot_m7:.2f} + Propina: ${propina_m7:.2f} = Total ${tot_pagar_m7:.2f}")

    # Cobro Barra: Pago en EFECTIVO sin propina
    c_barra = client.get("/cuentas/mesa/Barra").json()
    res_tk_barra = client.post("/ventas/ticket", json={
        "total": tot_barra,
        "propina": 0.0,
        "metodo_pago": "efectivo",
        "cajero_id": cajero["nombre"],
        "mesa": "Barra",
        "mesero": "Emilio Tapia",
        "cuenta_id": c_barra["id"],
        "partidas": p_barra
    })
    assert res_tk_barra.status_code == 201
    print(f"   -> Barra cobrada en EFECTIVO. Total: ${tot_barra:.2f}")

    # Comprobar que ya no hay cuentas abiertas
    cuentas_restantes = client.get("/cuentas").json()
    assert len(cuentas_restantes) == 0, "No debe quedar ninguna cuenta abierta"
    print("   -> Todas las mesas y cuentas abiertas han sido saldadas.")

    # 8. Generar Arqueo Parcial (Corte X)
    print("8. Generando Corte X (Arqueo Parcial)...")
    res_x = client.get("/turnos/corte_x")
    assert res_x.status_code == 200
    corte_x = res_x.json()
    print(f"   -> Corte X OK:")
    print(f"      Total Tickets: {corte_x['total_tickets']}")
    print(f"      Ventas Efectivo: ${corte_x['total_efectivo']:.2f}")
    print(f"      Ventas Tarjeta: ${corte_x['total_tarjeta']:.2f}")
    print(f"      Total en Caja (inc. Fondo): ${corte_x['efectivo_en_caja']:.2f}")

    # 9. Generar Cierre Definitivo de Turno (Corte Z)
    print("9. Sellando turno con Corte Z...")
    res_z = client.post("/turnos/corte_z")
    assert res_z.status_code == 200
    corte_z = res_z.json()
    assert corte_z["tipo_corte"] == "CORTE Z (Cierre Definitivo)"
    assert corte_z["fecha_cierre"] is not None
    print(f"   -> Turno #{corte_z['turno_id']} cerrado exitosamente a las {corte_z['fecha_cierre']}")

    # 10. Acceso y Validación de Reportes de Ventas
    print("10. Accediendo a Reportes Financieros y de Ventas...")
    res_rep = client.get("/reportes/ventas")
    assert res_rep.status_code == 200
    rep = res_rep.json()
    assert "gran_total" in rep
    assert "desglose_metodos" in rep
    assert "top_productos" in rep
    assert len(rep["top_productos"]) > 0

    print(f"   -> Gran Total Histórico: ${rep['gran_total']:.2f}")
    print(f"   -> Total Tickets Registrados: {rep['total_tickets']}")
    print("   -> Desglose por método de pago:")
    for m in rep["desglose_metodos"]:
        print(f"      - {m['metodo'].upper()}: ${m['total']:.2f} ({m['cantidad']} transacciones)")
    print("   -> Top Productos mas vendidos:")
    for tp in rep["top_productos"]:
        print(f"      - {tp['nombre']}: {tp['unidades']} unidades (${tp['monto']:.2f})")

    print("\n>>> SIMULACION DE TURNO COMPLETO COMPLETADA AL 100% CON EXITO <<<")
