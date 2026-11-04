# Guía de Resolución de Problemas & Fallos Operativos — MAREJADA POS

Guía técnica para resolver incidentes comunes durante la operación local del Punto de Venta.

---

## 1. Problemas de Base de Datos (SQLite)

### Síntoma: `sqlite3.OperationalError: database is locked`
- **Causa:** Múltiples procesos intentan escribir en el archivo `pos.db` simultáneamente mientras una transacción anterior quedó abierta.
- **Solución:**
  1. Verificar que el modo WAL (Write-Ahead Logging) esté activo ejecutando:
     ```bash
     python -c "import sqlite3; con=sqlite3.connect('backend/data/pos.db'); con.execute('PRAGMA journal_mode=WAL;'); con.close();"
     ```
  2. Si persiste, cerrar instancias duplicadas de Python ejecutando:
     ```powershell
     # Windows PowerShell:
     Stop-Process -Name "python" -Force
     ```

---

## 2. Errores de Red y Conectividad

### Síntoma: `Failed to fetch` o `ERR_CONNECTION_REFUSED` en el Frontend
- **Causa:** El backend en FastAPI no está corriendo o el puerto 8000 está ocupado.
- **Solución:**
  1. Comprobar la salud del backend visitando: `http://localhost:8000/docs`.
  2. Si el puerto está en conflicto:
     ```powershell
     Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
     ```
  3. Reiniciar el backend desde la carpeta `backend`:
     ```bash
     python -m uvicorn main:app --host 0.0.0.0 --port 8000
     ```

---

## 3. Hardware e Impresión Térmica

### Síntoma: El ticket se cobra en pantalla pero la impresora no expulsa papel ni abre el cajón
- **Causa:** Cable de red/USB desconectado, impresora sin papel o puerto ocupado.
- **Solución:**
  1. Verificar el LED de estado de la impresora (luz roja fija = falta de rollo térmico; luz roja parpadeante = tapa abierta).
  2. Probar la apertura física del cajón de dinero usando la llave manual de seguridad debajo de la gaveta.
  3. Si la conexión es por red IP (ej. `192.168.1.200`), verificar la conectividad haciendo `ping 192.168.1.200`.

---

## 4. Auditoría y Bloqueo de Cortes

### Síntoma: Al intentar hacer Corte Z aparece el error `"No se puede cerrar el turno: Existen cuentas abiertas"`
- **Causa:** La regla de integridad financiera impide sellar el turno si una mesa o pedido para llevar quedó sin cobrar.
- **Solución:**
  1. Entrar a la vista de **Punto de Venta**.
  2. Presionar el botón dorado **"Cuentas Abiertas"** en el sidebar.
  3. Revisar qué comanda sigue activa:
     - Si los clientes ya se retiraron y pagaron: Abrir la comanda y registrar el cobro correspondiente.
     - Si fue una comanda de prueba o errónea: Solicitar autorización de Administrador con NIP para auditar y cancelarla.
  4. Una vez que la lista muestre *"No hay cuentas pendientes por cobrar"*, el **Corte Z** se ejecutará de inmediato.
