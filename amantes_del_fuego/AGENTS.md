# Guía para agentes (Codex / Claude)

Sitio estático para "Amantes del Fuego" (artículos para el asado). Idioma: español rioplatense ("vos", "necesitás").

- Sin build ni dependencias: HTML + CSS + JS vanilla.
- Datos: la fuente principal es la planilla de Google (`js/config.js` → `PLANILLA`), leída por `js/datos.js` (pestañas Productos, Promos, Ajustes). `js/productos.js` es el respaldo y lo usa el video. No hardcodear productos en el HTML.
- Orden de scripts: productos.js, config.js, main.js (define `window.iniciarSitio`), datos.js (carga y llama). `/admin.html` + `js/admin.js` validan la planilla. Plantillas CSV en `plantilla/`.
- Paleta tomada del logo: negro puro `#000`, rojo brasa `#CB3127`. Tipografía Archivo: ancha (wdth 125) en títulos, normal en texto. Variables en `:root` de `css/styles.css`.
- Sin emojis en la interfaz; íconos en SVG inline. Un solo movimiento automático (brasa del hero), respetando prefers-reduced-motion.
- Video: `video-src/reel.html` + `node video-src/render.js [vertical]` regeneran img/video/*.mp4 desde productos.js. Chispas del hero en canvas (js/main.js), se pausan fuera de pantalla.
- SEO local: Arroyo Seco, Santa Fe (sin dirección exacta publicada). Schema Store en index.html (#schema-negocio), main.js completa URLs, horarios y catálogo. Al publicar con dominio: agregar canonical, og:url/og:image absolutos y sitemap.xml.
- Skills del repo: frontend-design, web-design-guidelines, seo-audit, schema (en .claude/skills).
- Fotos de productos en `img/productos/`, cuadradas con fondo blanco.
- Probar en ancho celular (360px) además de escritorio.
- Horarios en `HORARIOS` (js/productos.js); el estado abierto/cerrado usa hora de Argentina.
- Catálogo real cargado (Discos, Mecheros, Estacas, Cunitas/Leñeros). Fotos recortadas de capturas del catálogo de WhatsApp (480x480, fondo blanco).
