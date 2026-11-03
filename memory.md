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
- **Carga y Almacenamiento Local de Fotografías:**
  - Endpoint `POST /catalogo/upload-foto` en FastAPI con recepción multipart/form-data.
  - Almacenamiento persistente en `./backend/uploads/` servido estáticamente en `/uploads/{nombre}`.
  - Selector en Admin para subir fotos directamente desde el almacenamiento local o pegar enlaces URL.

## Hitos Completados
- [x] Soporte completo de carga de archivos de imagen locales (PNG, JPG, WEBP).
- [x] Previsualización inmediata de imagen y botón para quitar foto en el modal de productos.
- [x] Servidor FastAPI configurado con `app.mount("/uploads", StaticFiles)`.
- [x] Commits y push a `origin main` completados (`632ba80`).
