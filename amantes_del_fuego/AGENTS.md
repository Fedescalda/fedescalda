# Guía para agentes (Codex / Claude)

Sitio estático para "Amantes del Fuego" (artículos para el asado). Idioma: español rioplatense ("vos", "necesitás").

- Sin build ni dependencias: HTML + CSS + JS vanilla.
- Los productos viven **solo** en `js/productos.js` (array `PRODUCTOS`, número en `NUMERO_WHATSAPP`). No hardcodear productos en el HTML.
- Paleta tomada del logo: negro puro `#000`, rojo brasa `#CB3127`. Tipografía Archivo: ancha (wdth 125) en títulos, normal en texto. Variables en `:root` de `css/styles.css`.
- Sin emojis en la interfaz; íconos en SVG inline. Un solo movimiento automático (brasa del hero), respetando prefers-reduced-motion.
- Skills del repo: frontend-design, web-design-guidelines, seo-audit, schema (en .claude/skills).
- Fotos de productos en `img/productos/`, cuadradas con fondo blanco.
- Probar en ancho celular (360px) además de escritorio.
- Horarios en `HORARIOS` (js/productos.js); el estado abierto/cerrado usa hora de Argentina.
- Catálogo real cargado (Discos, Mecheros, Estacas, Cunitas/Leñeros). Fotos recortadas de capturas del catálogo de WhatsApp (480x480, fondo blanco).
