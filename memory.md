# Memoria de Estado y Progreso

## Decisiones Firmes
- Sin gestión de inventarios/stock: Cero columnas o tablas de inventario en backend o SQLite.
- Esquema estricto SQLite con SQLAlchemy ORM:
  - `usuarios`: `id`, `nombre`, `usuario`, `pin`, `rol` (cajero/mesero/admin), `cargo`, `activo_hoy`.
  - `asistencias`: `id`, `usuario_id`, `tipo` (entrada/salida), `fecha_hora`, `autorizado_por`.
  - `turnos`: `id`, `usuario_id`, `fondo_inicial`, `fecha_apertura`, `fecha_cierre`, `estado`.
  - `productos`: `id`, `nombre`, `precio`, `categoria`, `color_boton`, `descripcion`, `emoji`, `imagen_url`.
  - `tickets`: `id`, `turno_id`, `total`, `fecha_hora`, `metodo_pago`, `cajero_id`.
  - `partidas`: `id`, `ticket_id`, `producto_id`, `cantidad`, `subtotal`.
- **Lógica Completa de Cobro, Denominaciones y Cambio:**
  - Al pulsar "Cobro en Efectivo / Cambio" o "Cobrar con Tarjeta", se despliega la pantalla modal de cobro.
  - El cajero introduce el monto recibido o usa los botones táctiles de billetes rápidos (`$50`, `$100`, `$200`, `$500`, `$1000` o `Exacto`).
  - El sistema calcula el **cambio a entregar** en tiempo real con validación visual (color verde si cubre el total, rojo si falta dinero).
  - Al confirmar la venta, se genera y muestra el **Ticket Previo / Comprobante Térmico** con cabecera de negocio, mesa, cajero, desglose de partidas, total, efectivo entregado y cambio devuelto.

## Hitos Completados
- [x] Modal interactivo de cobro en efectivo y tarjeta.
- [x] Selector táctil de billetes rápidos y cálculo de cambio al cliente.
- [x] Teclado numérico táctil en pantalla integrado en el modal de cobro (1-9, C, 0, ⌫).
- [x] Cotejo de pago con tarjeta requiriendo los últimos 4 dígitos y campo opcional de autorización/voucher.
- [x] Asignación táctil e interactiva de Mesa (Matriz 1-16, Barra, Para Llevar) y Mesero responsable por comanda.
- [x] Vista previa estilizada de ticket físico térmico tras completar la venta con desglose de mesa, mesero, cajero, tarjeta o efectivo y cambio.
- [x] Suite de pruebas automatizadas en backend con Pytest (`test_pos.py`).
- [x] Commit y push a GitHub.
