# Skill: Procesamiento y Renderizado del Logotipo Marejada

## Rol & Propósito
Esta regla/skill define el estándar técnico oficial para procesar, recortar, convertir e integrar el logotipo de **MAREJADA – Café, Cocina, Bar** en la interfaz táctil del Punto de Venta (POS) y la pantalla de Login, garantizando soporte nativo para Vite, React y navegadores sin depender de etiquetas `<image>` dentro de SVGs externos que provocan renderizado en blanco.

---

## 1. Problema Técnico Resuelto
- **SVG con `<image xlink:href="...">`:** En Vite y entornos empaquetados de React, las rutas relativas incrustadas dentro de un SVG externo no se resuelven correctamente o son bloqueadas por políticas de seguridad del navegador, dejando el contenedor vacío.
- **Solución Estándar:** Generar un archivo **PNG nativo físico** (`logo-pos-blanco.png`) con canal Alpha (fondo transparente) y trazos blancos vectorizados antialiased, consumible directamente mediante etiquetas HTML/JSX `<img src="/logo-pos-blanco.png" alt="Marejada" />`.

---

## 2. Especificaciones del Activo Generado
- **Nombre de archivo:** `logo-pos-blanco.png` (Ubicado en la raíz y en `/frontend/public/logo-pos-blanco.png`).
- **Formato:** PNG con canal Alpha (`RGBA`), fondo `(0, 0, 0, 0)`.
- **Color de trazo:** Blanco puro `#FFFFFF` (`RGB(255, 255, 255)`).
- **Composición:**
  - **Isotipo (izquierda):** Sello circular artesanal (ola marina + brote botánico de lúpulo/piña).
  - **Espaciado (`padding`):** Separación horizontal de 40px.
  - **Logotipo (derecha):** "MAREJADA" + "CAFÉ, COCINA, BAR" redimensionado proporcionalmente al 65% de la altura del isotipo y alineado verticalmente al centro.
- **Resolución master:** `4882 x 1170 px` (densidad Ultra HD apta para pantallas táctiles de alta densidad de píxeles).

---

## 3. Script Maestro de Generación (`generar_logo.py`)
Para regenerar o recrear el logotipo ante cualquier cambio en el archivo maestro original `logo.jpg` o `logo.jpeg`:

```python
from PIL import Image, ImageOps

# 1. Cargar imagen y convertir a escala de grises
img = Image.open("logo.jpg").convert("L")
width, height = img.size

# 2. Invertir colores (negro a blanco) y aplicar canal alfa
img_inverted = ImageOps.invert(img)
img_rgba = img_inverted.convert("RGBA")

data = img_rgba.getdata()
new_data = [(255, 255, 255, pixel[0]) for pixel in data]
img_rgba.putdata(new_data)

# 3. Recortar isotipo superior y texto inferior por bounding box
split_y = int(height * 0.60)
icon_crop = img_rgba.crop((0, 0, width, split_y))
icon = icon_crop.crop(icon_crop.getbbox())

text_crop = img_rgba.crop((0, split_y, width, height))
text = text_crop.crop(text_crop.getbbox())

# 4. Redimensionar texto proporcional al icono
target_height = icon.height
new_text_height = int(target_height * 0.65)
new_text_width = int(new_text_height * (text.width / text.height))
text_resized = text.resize((new_text_width, new_text_height), Image.Resampling.LANCZOS)

# 5. Ensamblar horizontalmente sobre canvas transparente
padding = 40
new_width = icon.width + padding + new_text_width
final_img = Image.new("RGBA", (new_width, target_height), (0, 0, 0, 0))

final_img.paste(icon, (0, 0))
final_img.paste(text_resized, (icon.width + padding, (target_height - new_text_height) // 2))

# 6. Guardar en destinos de la app
final_img.save("logo-pos-blanco.png")
final_img.save("frontend/public/logo-pos-blanco.png")
print("logo-pos-blanco.png generado con éxito.")
```

---

## 4. Guía de Implementación en Componentes React
En los componentes de UI (`CajaView.jsx`, `LoginPinView.jsx`, `AdminView.jsx`):

```jsx
// Envoltorio recomendado con relieve y fondo oscuro de barra
<div className="w-full h-14 rounded-2xl bg-[#070A0E] border border-[#1A2330] p-2 flex items-center justify-center shadow-inner group">
  <img 
    src="/logo-pos-blanco.png" 
    alt="MAREJADA – Café, Cocina, Bar" 
    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" 
  />
</div>
```

---

## 5. Directrices de Integridad
- **Nunca** revertir a incrustar imágenes locales dentro de etiquetas `<image>` de SVG.
- **Mantener** el formato apaisado horizontal para optimizar el espacio vertical en los sidebars y la cabecera del login táctil.
- **Preservar** la sincronización entre el archivo maestro en la raíz y la carpeta `frontend/public/`.

