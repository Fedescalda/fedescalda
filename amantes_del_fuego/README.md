# 🔥 Amantes del Fuego — Sitio web

Landing page + catálogo para **Amantes del Fuego**, emprendimiento de parrillas, accesorios y utensilios para el asado.

> Mucho más que parrillas, una pasión que nos une.

## Qué incluye

- Portada con el logo y llamados a la acción.
- Sección "Nosotros" con la propuesta (productos seleccionados, calidad, atención personalizada).
- **Catálogo con filtros por categoría.**
- **Pedido por WhatsApp**: el cliente agrega productos y el sitio arma el mensaje y lo envía a `+54 9 3402 487788`.
- Links a Instagram (`@amantesdelfuego.as`) y al catálogo de WhatsApp.
- Botón flotante de WhatsApp, diseño adaptable a celular.

Es un sitio estático (HTML + CSS + JS, sin dependencias): se puede publicar gratis en GitHub Pages, Netlify o Vercel.

## Estructura

```
amantes_del_fuego/
├── index.html
├── css/styles.css
├── js/productos.js   ← acá se cargan los productos
├── js/main.js        ← filtros, carrito y WhatsApp
└── img/
    ├── logo.jpg
    └── productos/    ← fotos de los productos
```

## Cómo cargar productos

1. Copiá la foto en `img/productos/` (ej: `parrilla-hierro.jpg`, idealmente 800×600).
2. Editá `js/productos.js` y agregá o modificá un objeto:

```js
{ nombre: "Parrilla de hierro 80cm", categoria: "Parrillas", descripcion: "Varillas en V.", precio: 85000, imagen: "img/productos/parrilla-hierro.jpg" },
```

Con `precio: null` se muestra "Consultar precio". Las categorías de los filtros se arman solas.

> Precios cargados desde el catálogo de WhatsApp (noviembre 2026). Actualizarlos en `js/productos.js` cuando cambien.

## Video del catálogo

`img/video/reel.mp4` (web, 1280x720) y `img/video/reel-vertical.mp4` (Reels/Historias, 1080x1920) se generan solos a partir de `video-src/reel.html`, que toma los productos, fotos y precios de `js/productos.js`.
Cuando cambies precios o productos, regeneralos (necesita Node, Playwright y ffmpeg):

```bash
cd amantes_del_fuego
node video-src/render.js            # video de la web + poster
node video-src/render.js vertical   # video para Instagram
```

## Verlo en local

Abrí `index.html` en el navegador, o:

```bash
cd amantes_del_fuego && python3 -m http.server 8000
```
