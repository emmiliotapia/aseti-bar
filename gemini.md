# Blueprint: POS Local MVP

## Visión General
Punto de venta táctil y minimalista operado en local. Diseñado para maximizar la velocidad de cobro mediante un catálogo visual de botones y generar reportes de corte de caja instantáneos.

## Estructura de Directorios
- `/frontend`: UI de caja y panel administrativo (React).
- `/backend`: API REST y lógica de hardware (FastAPI).
- `/database`: Ubicación del archivo `pos.db` (SQLite).
- `/skills`: Reglas inyectables de diseño y negocio.
- `/docs`: Documentación técnica y bitácoras.

## Flujos Principales
1. **Pantalla de Login táctil por PIN** (Cajero vs Admin).
2. **Inicio de Turno** con registro de fondo inicial de caja.
3. **Panel de Ventas** (Selección de botones -> Cobro rápido en efectivo/tarjeta -> Impresión y apertura de cajón).
4. **Módulos de Corte X y Corte Z**:
   - **Corte X:** Lectura parcial para arqueo en turno activo sin cerrar la sesión.
   - **Corte Z:** Cierre de turno definitivo, conciliación de efectivo y sellado del turno.
5. **Panel de Administración Expandido**:
   - **Panel de Cajeros:** Gestión de usuarios, PINs y asignación de roles (cajero/admin).
   - **Panel de Productos:** Catálogo visual de botones (nombre, precio, categoría, color).
   - **Configuración Básica:** Nombre del negocio, IP/puerto de impresora térmica ESC/POS, pie de ticket y mensajes de cabecera.
