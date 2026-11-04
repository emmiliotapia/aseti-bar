# Guía de Hardware & Periféricos — MAREJADA POS

Este documento especifica los estándares de conexión, comandos de impresión y apertura física del cajón de dinero para el punto de venta local de **MAREJADA – Café, Cocina, Bar**.

---

## 1. Impresión Térmica de Tickets (ESC/POS)

El sistema genera tickets formateados en lenguaje nativo **ESC/POS**, garantizando compatibilidad con impresoras térmicas de 58mm y 80mm conectadas por USB, Red LAN/Ethernet o Puerto Serie.

### Parámetros Estándar de Impresión:
- **Ancho de papel estándar:** 80mm (48 caracteres por línea con Fuente A) o 58mm (32 caracteres por línea).
- **Juego de caracteres / Codificación:** `CP850` o `CP437` (soporte para acentos y caracteres en español).
- **Alineación:**
  - Cabecera y logotipo: Centrado (`ESC a 1`).
  - Lista de productos y subtotales: Justificado izquierda/derecha.
  - Pie de página y mensaje de agradecimiento: Centrado.

---

## 2. Comandos de Hardware Críticos

### A. Apertura de Cajón de Dinero (Cash Drawer)
El cajón portamonedas se conecta directamente a la impresora térmica mediante el puerto telefónico **RJ11 / RJ12**. 

El comando ESC/POS estándar envía un pulso eléctrico de 24V al solenoide del cajón:
```text
Comando Hexadecimal: 1B 70 00 19 FA
Comando Decimal:     ESC p 0 25 250
```
- **Disparador:** Se ejecuta de forma automática en cada venta registrada con método de pago en **Efectivo** y al confirmar la **Apertura de Turno** con fondo inicial.

### B. Corte Parcial / Total de Papel (Paper Cut)
Al concluir la emisión del ticket de venta o el comprobante de Corte X/Z:
```text
Avance de 3 líneas y corte: 1D 56 42 00 (GS V B 0)
```

---

## 3. Tipos de Conexión Recomendados

| Tipo de Interfaz | Configuración en MAREJADA | Ventaja Operativa |
| :--- | :--- | :--- |
| **Red Ethernet / Wi-Fi (IP fija)** | `192.168.1.200:9100` | Permite enviar comandas desde tablets táctiles de meseros en piso hacia barra/cocina. |
| **USB Directo (Windows / Linux)** | Puerto USB Virtual COM o Share Spooler | Conexión directa a la mini-PC de caja principal sin depender de la red local. |

---

## 4. Estructura Visual del Ticket Impreso
```text
================================================
           MAREJADA – CAFÉ, COCINA, BAR         
================================================
Ticket: #00042           Fecha: 04/11/2026 13:45
Mesa: Mesa 4             Mesero: Carlos M.
Cajero: Emilio Tapia     Modalidad: En Mesa
------------------------------------------------
Cant.  Descripción                     Total
------------------------------------------------
2      Cerveza Artesanal IPA         $192.00
1      Hamburguesa Marejada          $165.00
------------------------------------------------
Subtotal:                            $357.00
Propina Sugerida (15%):               $53.50
TOTAL:                               $410.50
------------------------------------------------
Método de Pago:     TARJETA
Cotejo Plástico:    •••• 4826
Autorización:       AUT-89410
================================================
     Sabor a mar, fuego y café. ¡Gracias!       
================================================
```
