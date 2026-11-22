<!-- Instrucciones para Codex y otros agentes. Mantener sincronizado con CLAUDE.md -->
# VisualGraf — tienda web de bolsas personalizadas

Sitio de **Visual Graf · "Tu bolsa impresa"**: bolsas impresas en serigrafía (manija riñón, para hielo y ecommerce)
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
npm run seed:sql   # regenera supabase/seed.sql desde src/lib/catalog.ts
```
Variables: copiar `.env.example` a `.env.local`. Sin Supabase/Mercado Pago el sitio funciona igual (catálogo base + WhatsApp).
`RATE_LIMIT_OFF=1` desactiva el rate limit de las APIs: solo para tests.

## Estructura
```
src/
  app/
    page.tsx                  Inicio
    productos/                Catálogo por categoría y ficha [slug] (Configurator + Gallery)
    personalizar/             Simulador de logo (components/customizer, lib/logo-processing.ts)
    promociones/ nuestra-historia/ contacto/ privacidad/
    carrito/                  Carrito + checkout (components/cart/Checkout.tsx)
    pedido/[token]/           Página privada del pedido: estado, pago, logo, aprobar diseño (actions.ts)
    admin/                    Login + (panel)/ pedidos, consultas, productos, promociones (server actions)
    api/contact               POST consulta → Supabase (service role)
    api/orders                POST pedido → recalcula precios en servidor → Mercado Pago o link WhatsApp
    api/promo                 GET valida código de descuento
    api/mercadopago/webhook   Actualiza estado del pedido (firma con MP_WEBHOOK_SECRET)
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx not-found.tsx
  components/                 Header, Footer, BagMockup (bolsa SVG), Reveal, ProductCard, PageHeader, CtaBand, Faq, Icons
  components/{home,product,customizer,cart,forms,admin}/
  lib/
    site.ts                   Contacto, navegación, waLink, formatARS
    catalog.ts                Tipos + catálogo base (precios reales) + colores de bolsa/impresión
    content.ts                Textos editables: historia, FAQ, rubros, pasos, clientes
    data.ts                   Lectura productos/promos (Supabase → catálogo base si no está configurado)
    orders.ts mercadopago.ts validation.ts (zod + rate limit) jsonld.ts
    notify.ts                 Avisos al dueño por email (Resend) y Telegram: pedidos, pagos, consultas
    order-status.ts           Estados del pedido y textos (compartido)
    order-events.ts           setOrderStatus(): cambia estado + historial + email al cliente (+ aviso al dueño)
    order-files.ts            Archivos privados del pedido (bucket "pedidos", URLs firmadas)
    customer-email.ts         Emails automáticos al cliente
    settings.ts               Envío: Andreani en vivo o por zona (tabla settings) y datos de transferencia
    andreani.ts andreani-core.ts  Cotizador Andreani (GET /v1/tarifas, sin login) + lógica pura (CP, bultos)
    design-store.ts           Diseño del simulador guardado en el navegador para el checkout
    supabase/                 Clientes browser/server/admin + config
  middleware.ts               Sesión Supabase para /admin
supabase/schema.sql seed.sql  Tablas, RLS, datos base
supabase/migrations/          Cambios posteriores (correr en orden)
scripts/seed-sql.ts           Genera seed.sql
tests/                        Playwright: smoke, flujos, compra
public/img/                   Fotos webp (productos/, clientes/) y logo
```

## Trabajo con Codex
Este proyecto se construye con Claude Code + Codex CLI (`codex exec`). Codex escribió la suite Playwright y el
panel admin, e hizo revisiones de código y seguridad. Al delegar: asignar archivos exclusivos y pedir que no corra
`npm run build` en paralelo (comparten `.next/`).

## Convenciones
- Textos en español de Argentina con voseo. Precios en ARS con `formatARS`.
- Server Components por defecto; `"use client"` solo donde hay interacción.
- Colores de marca: usar las clases/tokens (`bg-ink`, `text-brand-*`, `.text-gradient`, `.btn-primary`), no hex sueltos.
- Imágenes con `next/image` y `alt` descriptivo. Nuevas fotos: webp ≤ 1200px en `public/img/`.
- Nada de secretos en el código: todo por `.env.local` (ver `.env.example`). `SUPABASE_SERVICE_ROLE_KEY` y
  `MP_ACCESS_TOKEN` solo se usan en el servidor; nunca con prefijo `NEXT_PUBLIC_`.
- Accesibilidad: foco visible, `aria-label` en botones de ícono, contraste AA sobre fondo oscuro.
- Commits chicos y descriptivos en español.

## Flujo de compra automática
pendiente → (Mercado Pago webhook / admin marca transferencia) pagado → admin sube prueba → diseno →
cliente aprueba en /pedido/[token] → en_produccion → admin carga envío → enviado → entregado.
Todo cambio de estado pasa por `setOrderStatus()` para que quede en el historial y se avise al cliente.
Correr SQL contra Supabase desde la nube de Claude: no hay acceso directo al puerto de Postgres; usar un deploy
temporal de Vercel con un endpoint protegido por token y borrarlo después.

## Pendientes conocidos
- Confirmar precios de bolsas para hielo con manija riñón y ecommerce (hoy "a cotizar").
- La historia está tomada de la web actual: revisar que siga vigente.
- Política de privacidad: texto base, revisar con un profesional.
