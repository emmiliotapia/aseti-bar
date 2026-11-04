# 🌊 MAREJADA — Café, Cocina, Bar (POS Local)

Punto de venta táctil, minimalista y operado en red local, diseñado bajo retícula suiza para alta velocidad de cobro, gestión de comandas por mesa y arqueos financieros instantáneos (Cortes X y Z).

---

## 🚀 Requisitos del Sistema
- **Node.js:** Versión 18+ LTS
- **Python:** Versión 3.10+
- **Sistema Operativo:** Windows 10/11, macOS o Linux (Optimizado para pantallas táctiles)

---

## 🛠️ Puesta en Marcha Rápida (Local)

### 1. Clonar el repositorio
```bash
git clone https://github.com/emmiliotapia/aseti-bar.git
cd aseti-bar
```

### 2. Backend (FastAPI + SQLite)
```bash
cd backend
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*API y documentación interactiva disponibles en: `http://localhost:8000/docs`*

### 3. Frontend (React + Vite + TailwindCSS)
En otra terminal:
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
*Terminal de punto de venta disponible en: `http://localhost:5173`*

---

## 🔑 Credenciales por Defecto

| Rol | Usuario | PIN | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `emilio` | `1234` | Cobro, auditoría, anulación de partidas, catálogo y Corte Z |
| **Cajero / Mesero** | `carlos` | `0000` | Cobro táctil y apertura de comandas (requiere pase de asistencia) |

---

## ⚡ Directivas Centrales de Operación
1. **CERO INVENTARIOS:** Sistema puramente financiero de cobro rápido y arqueo; no maneja stock ni existencias.
2. **BLOQUEO CORTE Z:** Prohibido cerrar el turno definitivamente si existen comandas activas pendientes de pago.
3. **AISLAMIENTO DE MESAS:** Conmutar entre mesas (1–16), Barra o Para Llevar limpia y aísla automáticamente los productos en pantalla.
4. **NIP DE AUDITORÍA:** Los cajeros/meseros no pueden borrar artículos ni limpiar la comanda sin autorización de NIP Admin.

---

## 📁 Documentación de Soporte
- [Configuración de Hardware & Impresoras](docs/HARDWARE.md)
- [Registro de Decisiones Arquitectónicas (ADR)](docs/DECISIONS.md)
- [Resolución de Fallos & Troubleshooting](docs/TROUBLESHOOTING.md)
