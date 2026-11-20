# Guía para agentes (Codex / Claude)

Sitio estático para "Amantes del Fuego" (artículos para el asado). Idioma: español rioplatense ("vos", "necesitás").

- Sin build ni dependencias: HTML + CSS + JS vanilla.
- Los productos viven **solo** en `js/productos.js` (array `PRODUCTOS`, número en `NUMERO_WHATSAPP`). No hardcodear productos en el HTML.
- Paleta de marca (del logo): negro `#0b0b0b`, rojo `#d6352b`, blanco. Tipografía Montserrat. Variables en `:root` de `css/styles.css`.
- Fotos de productos en `img/productos/`, cuadradas con fondo blanco.
- Probar en ancho celular (360px) además de escritorio.
- Horarios en `HORARIOS` (js/productos.js); el estado abierto/cerrado usa hora de Argentina.
- Catálogo real cargado (Discos, Mecheros, Estacas, Cunitas/Leñeros). Fotos recortadas de capturas del catálogo de WhatsApp (480x480, fondo blanco).
