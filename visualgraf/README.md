# Visual Graf · Tu bolsa impresa

Tienda web de bolsas personalizadas para comercios y emprendimientos, con envíos a toda la Argentina.

- **Inicio**: hero, combinación bolsa + impresión interactiva, precios por medida, trabajos reales y FAQ.
- **Productos**: catálogo y ficha con configurador (medida, color de bolsa, color de impresión, packs).
- **Personalizar**: simulador que muestra tu logo impreso en la bolsa (se procesa en el navegador, sin subirlo).
- **Promociones**, **Nuestra historia**, **Contacto** (formulario + WhatsApp).
- **Carrito / checkout**: Mercado Pago Checkout Pro o cierre por WhatsApp.
- **Panel admin** (`/admin`): pedidos, consultas, productos y promociones.

## Correr en local

Requisitos: Node 20 o superior.

```bash
cd visualgraf
npm install
cp .env.example .env.local
npm run dev
```

Abrí http://localhost:3000. Sin completar `.env.local` la web ya funciona con el catálogo base (productos y
precios de vgtubolsaimpresa.store) y los pedidos se cierran por WhatsApp.

Otros comandos:

```bash
npm run build && npm run start   # producción
npm run lint && npm run typecheck
npm test                         # Playwright: celular, tablet y escritorio
```

## Base de datos y panel admin (Supabase, gratis)

1. Creá un proyecto en https://supabase.com.
2. En **SQL Editor** corré `supabase/schema.sql` y después `supabase/seed.sql`.
3. En **Project Settings → API** copiá `URL`, `anon key` y `service_role key` a `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. En **Authentication → Users** creá tu usuario (email + contraseña).
5. En **SQL Editor** hacelo admin:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'TU_EMAIL';
   ```
6. En **Authentication → Providers → Email** desactivá **Allow new users to sign up** (solo vos creás usuarios).
7. Entrá a `/admin/login`.

Si cambiás los productos base en `src/lib/catalog.ts`, regenerá el seed con `npm run seed:sql`.

## Pagos con Mercado Pago

1. En https://www.mercadopago.com.ar/developers → **Tus integraciones** → creá una aplicación (Checkout Pro).
2. Copiá el **Access Token** de producción a `MP_ACCESS_TOKEN` (para probar, usá el de prueba).
3. En **Webhooks** configurá la URL `https://TU-DOMINIO/api/mercadopago/webhook` (evento *Pagos*) y copiá la
   clave secreta a `MP_WEBHOOK_SECRET`.
4. `NEXT_PUBLIC_SITE_URL` tiene que ser la URL pública `https://…` para que funcionen el retorno y el webhook.

## Avisos de pedidos y consultas (email + celular)

Cada pedido nuevo, pago acreditado o consulta del formulario te llega al instante. Podés activar uno o los dos canales.

**Email (Resend, gratis hasta 3.000 mails/mes)**
1. Creá una cuenta en https://resend.com con el email donde querés recibir los avisos.
2. **API Keys → Create API Key** y copiala en `RESEND_API_KEY`.
3. En `NOTIFY_EMAIL` poné ese mismo email. Sin dominio propio, Resend solo deja enviar al email de tu cuenta, que es justo lo que necesitás.
   Si más adelante verificás `vgtubolsaimpresa.store` en Resend, podés usar `NOTIFY_FROM` y varios destinatarios separados por coma.

**Celular (Telegram, gratis)**
1. Instalá Telegram y escribile a **@BotFather** → `/newbot` → elegí un nombre (ej. "Avisos Visual Graf").
   Te da un token: copialo en `TELEGRAM_BOT_TOKEN`.
2. Abrí el chat con tu bot nuevo y mandale cualquier mensaje (por ejemplo "hola").
3. Entrá desde el navegador a `https://api.telegram.org/bot<TU_TOKEN>/getUpdates` y buscá `"chat":{"id":123456789`.
   Ese número va en `TELEGRAM_CHAT_ID`.
4. Activá las notificaciones del chat del bot en tu celular.

Después de cargar las variables (en `.env.local` o en Vercel → Settings → Environment Variables, y redeploy),
entrá al panel `/admin` y tocá **Probar avisos**.

## Publicar gratis en Vercel

1. Entrá a https://vercel.com con tu cuenta de GitHub.
2. **Add New → Project** → importá el repo `fedescalda`.
3. En **Root Directory** elegí `visualgraf` (el framework Next.js se detecta solo).
4. En **Environment Variables** cargá las de `.env.example` (como mínimo `NEXT_PUBLIC_SITE_URL` con la URL final).
5. **Deploy**. Cada push a la rama principal vuelve a publicar.
6. Dominio propio: **Settings → Domains** → agregá `vgtubolsaimpresa.store` y seguí las instrucciones DNS
   (registro A `76.76.21.21` o CNAME `cname.vercel-dns.com`). Actualizá `NEXT_PUBLIC_SITE_URL` y redeployá.
