"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { formatARS } from "@/lib/site";
import { provinces } from "@/lib/validation";
import { clearDesign, dataUrlToFile, loadDesign, type SavedDesign } from "@/lib/design-store";
import { IconArrow, IconMinus, IconPlus, IconShield, IconTrash, IconUpload, IconWhatsApp } from "../Icons";

type Methods = { mercadopago: boolean; transferencia: boolean };
type PayMethod = "mercadopago" | "transferencia" | "whatsapp";
type Quote = { price: number | null; zone: string | null; free: boolean };
type WaResult = { orderId: string; whatsappUrl: string; warning?: string };

const LOGO_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf";

export function Checkout({ methods }: { methods: Methods }) {
  const { items, subtotal, update, remove, clear, ready } = useCart();
  const defaultMethod: PayMethod = methods.mercadopago ? "mercadopago" : methods.transferencia ? "transferencia" : "whatsapp";
  const [payment, setPayment] = useState<PayMethod>(defaultMethod);
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState("");
  const [province, setProvince] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [design, setDesign] = useState<SavedDesign | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoLater, setLogoLater] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [waResult, setWaResult] = useState<WaResult | null>(null);

  useEffect(() => setDesign(loadDesign()), []);

  const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0;
  const shipping = quote?.price ?? 0;
  const total = subtotal - discount + shipping;

  // Cotización de envío automática al elegir provincia
  useEffect(() => {
    if (!province) return setQuote(null);
    const ctrl = new AbortController();
    fetch(`/api/shipping?provincia=${encodeURIComponent(province)}&subtotal=${subtotal - discount}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then(setQuote)
      .catch(() => {});
    return () => ctrl.abort();
  }, [province, subtotal, discount]);

  async function applyCode() {
    setPromoMsg("");
    if (!code.trim()) return;
    const res = await fetch(`/api/promo?code=${encodeURIComponent(code.trim())}`);
    const json = await res.json().catch(() => ({ ok: false }));
    if (json.ok) {
      setPromo({ code: json.code, percent: json.percent });
      setPromoMsg(`Código ${json.code} aplicado: ${json.percent}% off`);
    } else {
      setPromo(null);
      setPromoMsg("El código no es válido o ya venció.");
    }
  }

  const hasDesign = Boolean(design || logo);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!hasDesign && !logoLater) {
      setError("Subí tu logo o marcá que lo enviás después.");
      return;
    }
    const fields = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const { website = "", name, email, phone, business, cuit, province: prov, city, address, zip, notes } = fields;
    const payload = {
      customer: { name, email, phone, business, cuit, province: prov, city, address, zip, notes },
      website,
      paymentMethod: payment,
      promoCode: promo?.code ?? "",
      logoLater: !hasDesign && logoLater,
      items: items.map((i) => ({ productId: i.productId, size: i.size, bagColor: i.bagColor, inkColor: i.inkColor, quantity: i.quantity })),
    };
    setSending(true);
    try {
      const body = new FormData();
      body.set("payload", JSON.stringify(payload));
      if (logo) body.set("logo", logo);
      else if (design?.logo) body.set("logo", await dataUrlToFile(design.logo, design.logoName || "logo"));
      if (design) body.set("mockup", await dataUrlToFile(design.mockup, "simulacion.png"));

      const res = await fetch("/api/orders", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No pudimos registrar tu pedido");
      clearDesign();
      if (json.redirectUrl) {
        window.location.href = json.redirectUrl; // Mercado Pago
        return;
      }
      if (json.pageUrl) {
        clear();
        window.location.href = `${json.pageUrl}?nuevo=1`;
        return;
      }
      clear();
      setWaResult({ orderId: json.orderId, whatsappUrl: json.whatsappUrl, warning: json.warning });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setSending(false);
    }
  }

  if (waResult) {
    return (
      <div className="card mx-auto max-w-2xl p-8 text-center md:p-12" role="status">
        <p className="eyebrow">Pedido #{waResult.orderId}</p>
        <h2 className="mt-3 font-display text-3xl font-black">¡Último paso!</h2>
        {waResult.warning && <p className="mt-3 text-brand-yellow">{waResult.warning}</p>}
        <p className="mt-4 text-white/80">Enviá tu pedido por WhatsApp y adjuntá tu logo. Te confirmamos el diseño, el envío y el pago antes de producir.</p>
        <a href={waResult.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-8">
          <IconWhatsApp /> Enviar pedido por WhatsApp
        </a>
      </div>
    );
  }

  if (!ready) return <div className="h-80 animate-pulse rounded-3xl bg-white/5" />;

  if (items.length === 0) {
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <h2 className="font-display text-2xl font-black">Tu pedido está vacío</h2>
        <p className="mt-3 text-mute">Descubrí nuestros productos y empezá tu compra.</p>
        <Link href="/productos" className="btn btn-primary mt-6">
          Ver productos <IconArrow />
        </Link>
      </div>
    );
  }

  const submitLabel =
    payment === "mercadopago" ? `Pagar ${formatARS(total)} con Mercado Pago` : payment === "transferencia" ? "Confirmar y ver datos para transferir" : "Confirmar pedido";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
      <section aria-labelledby="items">
        <h2 id="items" className="sr-only">Productos</h2>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.key} className="card flex gap-4 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-ink-3">
                {i.image && <Image src={i.image} alt="" fill sizes="96px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/productos/${i.slug}`} className="font-display font-extrabold hover:underline">{i.name}</Link>
                <p className="text-sm text-mute">{i.size} · bolsa {i.bagColor} · impresión {i.inkColor}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-line" role="group" aria-label={`Cantidad de packs de ${i.name} ${i.size}`}>
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Restar un pack" onClick={() => (i.quantity > 1 ? update(i.key, i.quantity - 1) : remove(i.key))}>
                      <IconMinus width={16} height={16} />
                    </button>
                    <span className="w-24 text-center text-sm" aria-live="polite">{i.quantity} × {i.packSize} u.</span>
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Sumar un pack" onClick={() => update(i.key, Math.min(100, i.quantity + 1))}>
                      <IconPlus width={16} height={16} />
                    </button>
                  </div>
                  <p className="font-display font-extrabold">{formatARS(i.quantity * i.unitPrice)}</p>
                </div>
              </div>
              <button type="button" onClick={() => remove(i.key)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-mute hover:bg-white/10 hover:text-white" aria-label={`Quitar ${i.name} ${i.size}`}>
                <IconTrash width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>

        {/* Logo / diseño */}
        <div className="card mt-4 p-5">
          <h3 className="font-display text-lg font-black">Tu logo</h3>
          {design && (
            <div className="mt-3 flex items-center gap-4 rounded-2xl border border-brand-green/40 bg-brand-green/5 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen local (data URL) */}
              <img src={design.mockup} alt="Diseño armado en el simulador" className="h-20 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-brand-green">✓ Diseño del simulador adjunto</p>
                <p className="truncate text-mute">{design.summary}</p>
              </div>
              <button type="button" className="text-xs text-mute underline" onClick={() => { clearDesign(); setDesign(null); }}>Quitar</button>
            </div>
          )}
          <label className="ring-rainbow mt-3 flex cursor-pointer items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-4 hover:bg-white/[0.06]">
            <IconUpload />
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-semibold">{logo ? logo.name : design?.logo ? "Subir otra versión del logo (opcional)" : "Subí el archivo de tu logo"}</span>
              <span className="text-xs text-mute">PNG, JPG, SVG o PDF en buena calidad · hasta 4 MB</span>
            </span>
            <input
              type="file"
              accept={LOGO_TYPES}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > 4 * 1024 * 1024) {
                  setError("El logo pesa más de 4 MB. Exportalo más liviano o subilo después desde la página de tu pedido.");
                  e.target.value = "";
                  return;
                }
                setError("");
                setLogo(f);
              }}
            />
          </label>
          {!hasDesign && (
            <label className="mt-3 flex items-center gap-2 text-sm text-mute">
              <input type="checkbox" checked={logoLater} onChange={(e) => setLogoLater(e.target.checked)} className="accent-[#34d3f3]" />
              Lo envío después (desde la página de mi pedido)
            </label>
          )}
          {!design && (
            <p className="mt-2 text-xs text-mute">
              ¿Querés ver cómo queda? <Link href="/personalizar" className="underline">Probalo en el simulador</Link>.
            </p>
          )}
        </div>

        <div className="card mt-4 p-5">
          <label htmlFor="promo" className="label">Código de descuento</label>
          <div className="flex gap-2">
            <input id="promo" className="field" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ej: PROMO10" />
            <button type="button" onClick={applyCode} className="btn btn-ghost shrink-0">Aplicar</button>
          </div>
          {promoMsg && <p className="mt-2 text-sm text-mute" role="status">{promoMsg}</p>}
        </div>

        <dl className="card mt-4 space-y-2 p-5 text-sm" aria-live="polite">
          <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{formatARS(subtotal)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-brand-green"><dt>Descuento</dt><dd>-{formatARS(discount)}</dd></div>}
          <div className="flex justify-between">
            <dt className="text-mute">Envío{quote?.zone && quote.price != null ? ` (${quote.zone})` : ""}</dt>
            <dd className={quote?.price != null ? "" : "text-mute"}>
              {!province ? "Elegí tu provincia" : quote?.price == null ? "A coordinar" : quote.free ? "¡Gratis!" : formatARS(quote.price)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 font-display text-xl font-black"><dt>Total</dt><dd>{formatARS(total)}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="datos">
        <form onSubmit={onSubmit} className="card space-y-5 p-6 md:p-8">
          <h2 id="datos" className="font-display text-2xl font-black">Tus datos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label htmlFor="c-name" className="label">Nombre y apellido *</label><input id="c-name" name="name" required minLength={2} autoComplete="name" className="field" /></div>
            <div><label htmlFor="c-email" className="label">Email *</label><input id="c-email" name="email" type="email" required autoComplete="email" className="field" /></div>
            <div><label htmlFor="c-phone" className="label">WhatsApp *</label><input id="c-phone" name="phone" type="tel" required minLength={6} autoComplete="tel" inputMode="tel" className="field" /></div>
            <div><label htmlFor="c-business" className="label">Negocio o marca</label><input id="c-business" name="business" autoComplete="organization" className="field" /></div>
            <div><label htmlFor="c-cuit" className="label">CUIT (si necesitás factura)</label><input id="c-cuit" name="cuit" inputMode="numeric" className="field" /></div>
            <div>
              <label htmlFor="c-province" className="label">Provincia *</label>
              <select id="c-province" name="province" required className="field" value={province} onChange={(e) => setProvince(e.target.value)}>
                <option value="" disabled>Elegí</option>
                {provinces.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label htmlFor="c-city" className="label">Localidad *</label><input id="c-city" name="city" required autoComplete="address-level2" className="field" /></div>
            <div className="sm:col-span-2"><label htmlFor="c-address" className="label">Dirección de envío *</label><input id="c-address" name="address" required autoComplete="street-address" className="field" /></div>
            <div><label htmlFor="c-zip" className="label">Código postal</label><input id="c-zip" name="zip" autoComplete="postal-code" className="field" /></div>
            <div className="sm:col-span-2"><label htmlFor="c-notes" className="label">Notas (opcional)</label><textarea id="c-notes" name="notes" rows={2} maxLength={500} className="field" /></div>
            <div aria-hidden className="absolute -left-[9999px]"><input name="website" tabIndex={-1} autoComplete="off" /></div>
          </div>

          <fieldset>
            <legend className="label">¿Cómo querés pagar?</legend>
            <div className="space-y-2">
              {methods.mercadopago && (
                <PayOption id="mercadopago" current={payment} onChange={setPayment} title="Mercado Pago" text="Tarjetas de crédito, débito y dinero en cuenta. Se acredita al instante." />
              )}
              {methods.transferencia && (
                <PayOption id="transferencia" current={payment} onChange={setPayment} title="Transferencia bancaria" text="Te mostramos el alias/CBU al confirmar. Acreditamos y te avisamos." />
              )}
              {!methods.mercadopago && !methods.transferencia && (
                <PayOption id="whatsapp" current={payment} onChange={setPayment} title="Coordinar por WhatsApp" text="Te pasamos los datos de pago y confirmamos el envío." />
              )}
            </div>
          </fieldset>

          {error && <p role="alert" className="rounded-xl border border-brand-magenta/50 bg-brand-magenta/10 px-4 py-3 text-sm">{error}</p>}

          <button type="submit" disabled={sending} className="btn btn-primary w-full whitespace-normal">
            {sending ? "Procesando…" : submitLabel}
          </button>
          <p className="flex items-center gap-2 text-xs text-mute"><IconShield width={16} height={16} /> Antes de imprimir te enviamos la prueba de diseño para que la apruebes.</p>
        </form>
      </section>
    </div>
  );
}

function PayOption({ id, current, onChange, title, text }: { id: PayMethod; current: PayMethod; onChange: (m: PayMethod) => void; title: string; text: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${current === id ? "border-white bg-white/10" : "border-line"}`}>
      <input type="radio" name="pay" className="mt-1 accent-[#34d3f3]" checked={current === id} onChange={() => onChange(id)} />
      <span><span className="block font-semibold">{title}</span><span className="text-sm text-mute">{text}</span></span>
    </label>
  );
}
