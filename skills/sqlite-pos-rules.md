# Skill: Base de Datos y Reglas de Negocio (SQLite POS Rules)

## Directivas Estrictas de Persistencia
1. **CERO INVENTARIOS:** Prohibido estrictamente crear columnas de `stock`, `cantidad_almacen` o tablas de inventario/existencias. El sistema no rastrea inventario bajo ninguna circunstancia.

2. **Tabla `usuarios` (Control de Acceso por PIN):**
   - Columnas: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `nombre` (TEXT NOT NULL), `pin` (TEXT NOT NULL UNIQUE), `rol` (TEXT NOT NULL CHECK(rol IN ('cajero', 'admin'))).

3. **Tabla `turnos` (Control de Caja):**
   - Columnas: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `usuario_id` (INTEGER NOT NULL, FK usuarios(id)), `fondo_inicial` (REAL NOT NULL), `fecha_apertura` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), `fecha_cierre` (TIMESTAMP NULL), `estado` (TEXT NOT NULL DEFAULT 'abierto' CHECK(estado IN ('abierto', 'cerrado'))).

4. **Tabla `configuracion` (Ajustes de Negocio y Hardware):**
   - Columnas: `clave` (TEXT PRIMARY KEY), `valor` (TEXT NOT NULL).
   - Claves clave: nombre_negocio, impresora_ip, impresora_puerto, pie_ticket, encabezado_ticket.

5. **Tabla `productos` (Catálogo Táctil):**
   - Columnas: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `nombre` (TEXT NOT NULL), `precio` (REAL NOT NULL), `categoria` (TEXT NOT NULL), `color_boton` (TEXT DEFAULT '#1A1A1E').

6. **Tablas Transaccionales de Ventas:**
   - Tabla `tickets`: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `turno_id` (INTEGER NOT NULL, FK turnos(id)), `total` (REAL NOT NULL), `fecha_hora` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), `metodo_pago` (TEXT NOT NULL), `cajero_id` (TEXT NOT NULL).
   - Tabla `partidas`: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `ticket_id` (INTEGER NOT NULL, FK tickets(id) ON DELETE CASCADE), `producto_id` (INTEGER NOT NULL, FK productos(id)), `subtotal` (REAL NOT NULL).

7. **Cortes de Caja (Corte X y Corte Z):**
   - **Corte X (Arqueo Parcial):** Consulta `SUM(total)` de tickets asociados al `turno_id` en estado `'abierto'` desglosado por método de pago + `fondo_inicial`.
   - **Corte Z (Cierre de Turno):** Mismo cálculo que Corte X, estableciendo `fecha_cierre = CURRENT_TIMESTAMP` y `estado = 'cerrado'` en la tabla `turnos`.

8. **Configuración de Integridad:**
   - Ejecutar obligatoriamente `PRAGMA foreign_keys = ON;` al iniciar cada conexión en SQLite / FastAPI.
