# VisualGraf — tienda web de bolsas personalizadas

Sitio de **Visual Graf · "Tu bolsa impresa"**: bolsas impresas en serigrafía (troqueladas y para hielo)
para comercios y emprendimientos, con venta a toda Argentina. Idioma: español rioplatense (voseo:
"elegí", "subí", "pedí"). Público: emprendedores y comercios. Objetivo: vender y captar compradores.

## Stack
- **Next.js 15 (App Router) + TypeScript + React 19**: SSR/SSG, SEO (metadata, sitemap, OG) y deploy simple en Vercel.
- **Tailwind CSS v4**: tokens de marca en `src/app/globals.css` (`@theme`). Sin librería de UI.
- **Supabase** (opcional): Postgres + Auth + RLS. Esquema en `supabase/schema.sql`.
  Sin variables de entorno, el sitio funciona con datos de ejemplo de `src/lib/catalog.ts`.
- **Mercado Pago Checkout Pro** (opcional): `src/lib/mercadopago.ts`. Sin `MP_ACCESS_TOKEN` el pedido se cierra por WhatsApp.
- **Playwright** para pruebas e2e y capturas responsive (`tests/`).

## Comandos
```bash
npm install        # dependencias
npm run dev        # desarrollo en http://localhost:3000
npm run build      # build de producción (debe pasar sin errores ni warnings)
npm run start      # servir el build
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Playwright (levanta el server solo). En la nube de Claude: PW_CHROMIUM=/opt/pw-browsers/chromium
```

## Estructura
```
src/
  app/
    page.tsx                  Inicio
    productos/                Catálogo y ficha [slug] (configurador + agregar al pedido)
    personalizar/             Simulador: subir logo → ver la bolsa impresa → descargar / pedir
    promociones/              Promos vigentes (Supabase o ejemplo)
    nuestra-historia/         Línea de tiempo
    contacto/                 Formulario + WhatsApp
    carrito/                  Carrito y checkout (Mercado Pago o WhatsApp)
    pedido/[estado]/          Retorno de Mercado Pago (exito | pendiente | error)
    admin/                    Login + panel (pedidos, consultas, productos, promos)
    api/contact|orders|mercadopago/webhook
    sitemap.ts robots.ts opengraph-image.tsx manifest.ts
  components/                 UI reutilizable (Header, Footer, BagMockup, Reveal…)
  components/cart/            Contexto del carrito (localStorage)
  lib/
    site.ts                   Datos de contacto, navegación, helpers (waLink, formatARS)
    catalog.ts                Tipos + datos de ejemplo (productos, promos, colores)
    content.ts                Textos editables (historia, FAQ, rubros)
    data.ts                   Lectura de productos/promos (Supabase → fallback ejemplo)
    supabase/                 Clientes browser/server/admin
    mercadopago.ts            Preferencias de pago
supabase/schema.sql           Tablas, RLS y datos iniciales
public/img/                   Imágenes optimizadas (webp) y logo
```

## Convenciones
- Textos en español de Argentina con voseo. Precios en ARS con `formatARS`.
- Server Components por defecto; `"use client"` solo donde hay interacción.
- Colores de marca: usar las clases/tokens (`bg-ink`, `text-brand-*`, `.text-gradient`, `.btn-primary`), no hex sueltos.
- Imágenes con `next/image` y `alt` descriptivo. Nuevas fotos: webp ≤ 1200px en `public/img/`.
- Nada de secretos en el código: todo por `.env.local` (ver `.env.example`). `SUPABASE_SERVICE_ROLE_KEY` y
  `MP_ACCESS_TOKEN` solo se usan en el servidor; nunca con prefijo `NEXT_PUBLIC_`.
- Accesibilidad: foco visible, `aria-label` en botones de ícono, contraste AA sobre fondo oscuro.
- Commits chicos y descriptivos en español.

## Pendientes conocidos
- Precios y promociones de `catalog.ts` / `schema.sql` son **de ejemplo**: reemplazar por los reales.
- Textos de "Nuestra historia" (`content.ts`) son genéricos: completar con fechas e hitos reales.
