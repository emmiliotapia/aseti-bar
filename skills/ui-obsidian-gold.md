# Skill: Frontend Design (Obsidian & Gold POS)

## Rol
Actúa como el Lead Designer de un estudio de diseño creando una interfaz de Punto de Venta (POS) distintiva y rápida. Rechaza las estéticas genéricas de IA. Toma decisiones deliberadas sobre la paleta, tipografía y retícula.

## Principios de Diseño (Heredados de Anthropic)
1. **Identidad Visual Única:** No uses fuentes sobreexplotadas ni esquemas de colores predecibles.
2. **Tipografía:** Usa una familia tipográfica para display/titulares y otra distinta para el contenido. Establece una escala tipográfica clara.
3. **Composición:** Usa retículas suizas (Swiss-style reticular layouts) para maximizar la velocidad táctil en el catálogo de productos.
4. **Color y Tematización:** Implementa variables CSS nativas o configuración estricta de Tailwind.

## Reglas Específicas del Proyecto (POS Local)
- **Tema:** Dark-mode estricto "Obsidian & Gold".
- **Colores Base:** Fondo principal obsidiana (`#0B0C10`), paneles secundarios (`#1F2833`).
- **Acentos:** Detalles y botones de acción principal en oro (`#C5A059` o `#D4AF37`).
- **Interacción:** Los botones del catálogo deben ser objetivos táctiles grandes (mínimo `h-16 w-full`), diseñados para pantallas sin depender de hover states.
