# Memoria de Estado y Progreso

## Decisiones Firmes
- Sin gestión de inventarios/stock: Cero columnas o tablas de inventario en backend o SQLite.
- Esquema estricto SQLite con SQLAlchemy ORM:
  - `usuarios`: `id`, `nombre`, `pin`, `rol` (cajero/admin).
  - `turnos`: `id`, `usuario_id`, `fondo_inicial`, `fecha_apertura`, `fecha_cierre`, `estado` (abierto/cerrado).
  - `configuracion`: `clave` (PK), `valor`.
  - `productos`: `id`, `nombre`, `precio`, `categoria`, `color_boton`.
  - `tickets`: `id`, `turno_id` (FK turnos), `total`, `fecha_hora`, `metodo_pago`, `cajero_id`.
  - `partidas`: `id`, `ticket_id` (FK tickets), `producto_id` (FK productos), `subtotal`.
  - Cortes de caja: Corte X (arqueo sobre turno activo) y Corte Z (cierre formal y sellado de turno).
  - Integridad referencial: `PRAGMA foreign_keys = ON;`.
- Repositorio y Versionado:
  - Remoto: `origin -> https://github.com/emmiliotapia/aseti-bar.git`
  - Rama: `main`
  - `.gitignore` robusto ignorando `node_modules`, `dist`, `__pycache__`, bases de datos SQLite locales (`*.db`, `*.sqlite3`) y logs.
- Diseño estricto: Dark Mode "Obsidian & Gold" con retículas suizas (`#0B0C10` obsidiana base, `#14171E` tarjetas, `#1F2833` paneles, `#C5A059` oro de acento).
- Tipografía dual + mono: `Syne` (display/títulos), `Plus Jakarta Sans` (UI/contenido) y `JetBrains Mono` (precios y métricas numéricas).
- Estructura Monorepo y Dockerización:
  - `backend/`: FastAPI + SQLAlchemy + SQLite (`Dockerfile` expuesto en puerto 8000).
  - `frontend/`: React + Vite + Nginx multi-stage (`Dockerfile` expuesto en puerto 3000 -> 80).
  - `docker-compose.yml`: Persistencia montada en `./backend/data`.
- Habilitación de skills locales en Antigravity (`skills/ui-obsidian-gold.md` y `skills/sqlite-pos-rules.md`).

## Tareas Pendientes (TODO)
- [ ] Push a `origin main` (cuando se configure autenticación en Git/SSH/PAT).
- [ ] Generar pantalla de Login táctil por PIN y teclado numérico en React bajo `ui-obsidian-gold.md`.
- [ ] Flujo de Inicio de Turno (fondo inicial de caja).
- [ ] Actualizar modelos backend (`models.py`, `schemas.py`) y endpoints para usuarios, turnos, configuración, Corte X y Corte Z.
- [ ] Conectar llamadas API de React (`CajaView.jsx`) hacia FastAPI (`/catalogo/productos` y `/ventas/ticket`).
- [ ] Integración de hardware local (impresión térmica y apertura de cajón con ESC/POS).
- [ ] Expandir `AdminView` con Panel de Cajeros, Catálogo y Configuración Básica.

## Hitos Completados
- [x] Definición de arquitectura base y archivos de contexto maestro (`gemini.mti`, `gemini.md`, `memory.md`, `errores.md`).
- [x] Redefinición y expansión del alcance del MVP en documentos maestros.
- [x] Creación y consolidación de directivas en `skills/sqlite-pos-rules.md` y `skills/ui-obsidian-gold.md`.
- [x] Inicialización del entorno Frontend con React, Vite y TailwindCSS.
- [x] Construcción del componente principal `CajaView.jsx` con retícula suiza táctil y diseño Obsidian & Gold.
- [x] Inicialización del backend con FastAPI y SQLAlchemy.
- [x] Configuración de Docker y Docker Compose para backend y frontend.
- [x] **Configuración e inicialización del repositorio Git vinculado a `https://github.com/emmiliotapia/aseti-bar.git` con buenas prácticas de `.gitignore` (exclusión de `.db`, temporales, node_modules) y commit inicial en rama `main`.**
