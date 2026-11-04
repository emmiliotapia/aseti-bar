# Registro de Decisiones Arquitectónicas (ADR) — MAREJADA POS

Este documento registra el fundamento y las justificaciones de las decisiones de diseño, negocio y arquitectura técnica adoptadas para **MAREJADA – Café, Cocina, Bar**. Su objetivo es asegurar la coherencia del sistema e impedir regresiones o cambios accidentales en futuras iteraciones.

---

## ADR 001: Política de "Cero Inventarios"
- **Estado:** Aceptado (Inviolable).
- **Contexto:** En restaurantes, barras y cafés de alta rotación, registrar mermas por gramaje, recetas de coctelería o existencias en tiempo real durante la hora punta entorpece y ralentiza el cobro en caja.
- **Decisión:** Se prohíbe terminantemente la creación de tablas, columnas o validaciones de existencias (`stock`, `inventario`, `cantidad_disponible`) en la base de datos o en la interfaz.
- **Consecuencia:** La base de datos es ligera, el cobro es instantáneo y las ventas nunca son bloqueadas por falsos faltantes de inventario en el software.

---

## ADR 002: Aislamiento Automático de Comandas al Conmutar Mesas
- **Estado:** Aceptado.
- **Contexto:** En sistemas tradicionales de comanda abierta, cuando un mesero cambia de la Mesa 4 a la Mesa 8, productos agregados por error pueden permanecer en pantalla y facturarse a clientes equivocados.
- **Decisión:** Al cambiar de mesa, servicio en barra o pedido para llevar, el ticket visual en curso se limpia automáticamente y se carga de manera aislada la orden perteneciente a la mesa seleccionada.
- **Consecuencia:** Cero cruce de cuentas y menor merma por errores humanos de cobro.

---

## ADR 003: Bloqueo Obligatorio del Corte Z ante Cuentas Abiertas
- **Estado:** Aceptado.
- **Contexto:** Cerrar un turno financiero (Corte Z) con cuentas en curso ocasiona descuadres irrecuperables en el fondo de caja y pérdida de ingresos.
- **Decisión:** El endpoint del backend rechaza con código `HTTP 400` cualquier intento de ejecutar el Corte Z si existe al menos una comanda con estado `abierta`.
- **Consecuencia:** La administración tiene la garantía de que cada turno sellado refleja con exactitud la totalidad de las ventas cobradas.

---

## ADR 004: Auditoría Administrativa con NIP para Borrado de Partidas
- **Estado:** Aceptado.
- **Contexto:** Fugas financieras comunes en hostelería ocurren cuando el personal de servicio limpia una comanda o elimina productos del ticket antes del pago en efectivo.
- **Decisión:** La acción de vaciar la comanda o decrementar la cantidad de un producto hasta cero requiere la introducción del NIP de un usuario con rol de Administrador (`/auth/verificar-pin-admin`).
- **Consecuencia:** Trazabilidad absoluta de anulaciones y prevención de fraudes internos en piso.

---

## ADR 005: Formato Físico de Logotipo PNG vs. SVG Interno
- **Estado:** Aceptado.
- **Contexto:** Los navegadores y los empaquetadores modernos como Vite restringen o bloquean el renderizado de etiquetas `<image>` dentro de archivos SVG externos por políticas de seguridad, dejando el logo en blanco.
- **Decisión:** Se utiliza un archivo físico nativo en formato PNG con canal Alpha y trazos blancos nítidos (`logo-pos-blanco.png`) generado mediante un script reproducible con Pillow.
- **Consecuencia:** Renderizado instantáneo, nítido y 100% compatible en cualquier pantalla táctil o navegador.
