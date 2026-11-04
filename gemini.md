# MAREJADA POS — Project Rules & Architecture Blueprint

## 1. Visión General
Punto de venta táctil, minimalista y operado en local para **MAREJADA – Café, Cocina, Bar**. Diseñado para maximizar la velocidad de cobro táctil (Swiss grid), gestión de cuentas abiertas aisladas y arqueos financieros instantáneos (Cortes X y Z).

---

## 2. Core Directives (Reglas Inviolables)
1. **CERO INVENTARIOS:** Estrictamente prohibido crear tablas, columnas o lógica para rastrear existencias/stock de productos. El sistema es puramente para cobro rápido y cortes de caja.
2. **STACK TECNOLÓGICO:**
   - **Frontend:** React + Vite + TailwindCSS (modo oscuro sobrio `#070A0E` / `#0B0F15`).
   - **Backend:** FastAPI + SQLite (`backend/data/pos.db`).
3. **HARDWARE LOCAL:** Impresión térmica y apertura de cajón mediante comandos ESC/POS estándar.
4. **BLOQUEO CORTE Z:** Jamás permitir el cierre de turno si existen cuentas abiertas sin cobrar.
5. **AUDITORÍA ADMIN:** Cajeros y meseros no pueden limpiar comandas ni cancelar partidas sin validación previa del NIP de Administrador (`/auth/verificar-pin-admin`).

---

## 3. Dynamic Skills (Consultar bajo demanda antes de codificar)
- **Diseño, Identidad y Paleta:** `skills/ui-marejada-design.md`
- **Procesamiento y Render de Logotipo:** `skills/logo-processing-rules.md`
- **Base de Datos, Turnos y Cortes X/Z:** `skills/sqlite-pos-rules.md`
- **Auditoría de Interfaz:** `skills/web-interface-auditor.md`

---

## 4. Estructura del Proyecto
- `/frontend`: SPA táctil de caja, comanda interactiva y panel administrativo.
- `/backend`: API REST FastAPI, routers (`auth`, `caja`, `turnos`, `catalogo`, `reportes`) y hardware.
- `/backend/data`: Base de datos SQLite local (`pos.db`).
- `/skills`: Reglas modulares de diseño y lógica de negocio.
- `/docs`: Documentación y bitácoras del sistema.

---

## 5. Flujos Principales de Operación
1. **Login Táctil por PIN:** Autenticación de colaboradores con validación de asistencia previa.
2. **Apertura de Turno:** Registro del fondo inicial en caja para arqueos.
3. **Cuentas Abiertas y Comandas Aisladas:**
   - Asignación por Mesa (1–16), Barra o Para Llevar.
   - Limpieza y aislamiento automático al conmutar entre mesas o servicios.
   - Módulo interactivo de propinas opcionales (0%, 10%, 15%, 20%).
4. **Cortes de Caja:**
   - **Corte X:** Arqueo y lectura parcial en vivo sin sellar el turno.
   - **Corte Z:** Conciliación final, sellado del turno y cierre definitivo.
