# Guía de Seguimiento y Traspaso para Agentes

> **Propósito:** Este documento proporciona una visión clara, estructurada e inmediata del estado del proyecto para que cualquier nuevo agente de IA o desarrollador pueda retomar la construcción del **POS Local MVP** sin fricción ni desviaciones del alcance.

---

## 1. Visión y Directivas Inquebrantables
- **Propósito:** Punto de Venta (POS) local táctil y de alta velocidad para bar/restobar.
- **Regla de Oro (Backend):** **CERO INVENTARIOS**. Prohibido crear tablas de stock, almacenes, conteos de existencias o columnas de inventario. Todo se centra en cobro rápido y cortes de caja.
- **Regla de Oro (Frontend):** Diseño estricto **"Obsidian & Gold"** bajo retícula suiza (`skills/ui-obsidian-gold.md`). Objetivos táctiles sobredimensionados (`h-16 w-full` para cobros) sin depender de estados `hover`.
- **Integridad DB:** `PRAGMA foreign_keys = ON;` obligatorio en cada conexión SQLite.

---

## 2. Mapa de Documentos de Contexto
Antes de realizar cualquier modificación, el agente debe leer:
1. `gemini.mti` — Contexto maestro y directivas del IDE Antigravity.
2. `gemini.md` — Blueprint funcional y flujos principales del sistema.
3. `skills/sqlite-pos-rules.md` — Reglas estrictas de esquemas de datos, tickets y cortes.
4. `skills/ui-obsidian-gold.md` — Directivas de diseño visual (paleta `#0B0C10`, `#14171E`, `#1F2833`, `#C5A059`, tipografías *Syne*, *Plus Jakarta Sans*, *JetBrains Mono*).
5. `memory.md` — Bitácora de decisiones, hitos y tareas pendientes.
6. `errores.md` — Bitácora de incidencias técnicas.

---

## 3. Estado Actual de la Arquitectura

### Monorepo
```plaintext
/ (Raíz)
├── docker-compose.yml          # Orquestación con persistencia en ./backend/data
├── skills/
│   ├── ui-obsidian-gold.md     # Directiva visual Swiss Grid & Obsidian-Gold
│   └── sqlite-pos-rules.md     # Esquemas y directiva cero-inventario
├── backend/
│   ├── Dockerfile              # Python 3.12-slim
│   ├── requirements.txt        # fastapi, uvicorn, sqlalchemy, pydantic
│   ├── database.py             # SQLAlchemy Engine + listener PRAGMA foreign_keys=ON
│   ├── models.py               # Modelos Producto, Ticket, Partida (y pendientes Usuarios/Turnos/Config)
│   ├── schemas.py              # Esquemas Pydantic v2
│   ├── main.py                 # Endpoints /catalogo, /ventas/ticket, /ventas/corte
│   └── data/                   # pos.db (ignorado en git)
└── frontend/
    ├── Dockerfile & nginx.conf # Multi-stage Nginx production build
    ├── vite.config.js          # Vite + @tailwindcss/vite
    ├── index.html              # Tipografías Google Fonts (Syne, Plus Jakarta Sans, JetBrains Mono)
    └── src/
        ├── index.css           # Variables de tema Obsidian & Gold
        ├── App.jsx             # Switcher de vistas
        └── views/
            ├── CajaView.jsx    # UI táctil terminada con retícula suiza y catálogo mock/demo
            └── AdminView.jsx   # Esqueleto de administración
```

---

## 4. Tareas Inmediatas Pendientes (Próximos Pasos Recomendados)

Cualquier nuevo agente debe enfocarse en la siguiente secuencia lógica:

1. **Pantalla de Login por PIN & Teclado Numérico Táctil:**
   - Crear componente de teclado táctil numérico (0-9, borrar, enter) bajo la estética Obsidian & Gold.
   - Manejar discriminación de roles: `cajero` (redirige a `CajaView`) vs `admin` (redirige a `AdminView`).
2. **Inicio de Turno (Apertura de Caja):**
   - Modal o vista de apertura solicitando `fondo_inicial` de caja al iniciar turno.
3. **Actualización de Modelos y Rutas en Backend:**
   - Agregar modelos `Usuario`, `Turno` y `Configuracion` en `backend/models.py` y `backend/schemas.py` según `skills/sqlite-pos-rules.md`.
   - Modificar `Ticket` para enlazar `turno_id`.
   - Implementar endpoints para `Corte X` (parcial en turno activo) y `Corte Z` (cierre definitivo de turno).
4. **Conexión Frontend ⇄ Backend:**
   - Conectar `CajaView.jsx` a `GET /catalogo/productos` y `POST /ventas/ticket` reemplazando los mocks locales por datos persistidos en SQLite.
5. **Hardware Local (ESC/POS):**
   - Módulo en backend para generación de comandos de impresión térmica y apertura de cajón de dinero.

---

## 5. Comandos Rápidos de Ejecución

### Ejecución Local Directa
```powershell
# Backend (FastAPI)
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (Vite)
cd frontend
npm run dev
```

### Ejecución con Docker Compose
```powershell
docker compose up -d --build
```

- **Frontend:** `http://localhost:3000` (o `http://127.0.0.1:5173` en dev)
- **Backend Swagger Docs:** `http://localhost:8000/docs`
- **Git Repo:** `https://github.com/emmiliotapia/aseti-bar.git` (Rama `main`)
