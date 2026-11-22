"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { bagColors, inkColors, type Product } from "@/lib/catalog";
import { formatARS, waLink } from "@/lib/site";
import { useCart } from "../cart/CartProvider";
import { flyToCart } from "@/lib/fly-to-cart";
import { Gallery } from "./Gallery";
import { IconBag, IconBrush, IconCheck, IconMinus, IconPlus, IconWhatsApp } from "../Icons";

function Swatch({ hex, id }: { hex: string; id: string }) {
  const bg = id === "cristal" ? "linear-gradient(135deg,#ffffff99,#cfe3f340)" : id === "oro" ? "linear-gradient(135deg,#f4d77d,#a77b23)" : id === "plata" ? "linear-gradient(135deg,#f1f2f4,#8e939b)" : hex;
  return <span className="h-5 w-5 shrink-0 rounded-full border border-white/30" style={{ background: bg }} aria-hidden />;
}

export function Configurator({ product }: { product: Product }) {
  const params = useSearchParams();
  const router = useRouter();
  const { add } = useCart();
  const raw = Number(params.get("medida"));
  const initial = Number.isInteger(raw) && raw >= 0 && raw < product.variants.length ? raw : 0;
  const [vi, setVi] = useState(initial);
  const paramBag = params.get("bolsa") as Product["colors"][number] | null;
  const paramInk = params.get("tinta");
  const fromDesigner = params.get("diseno") === "1";
  const [bag, setBag] = useState(paramBag && product.colors.includes(paramBag) ? paramBag : product.colors[0]);
  const [ink, setInk] = useState(paramInk && inkColors.some((c) => c.id === paramInk) ? paramInk : product.colors[0] === "negro" ? "blanco" : "negro");
  const [packs, setPacks] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => setVi(initial), [initial]);
  // Si cambia la selección, se puede volver a agregar
  useEffect(() => setAdded(false), [vi, bag, ink, packs]);

  const variant = product.variants[vi];
  const price = variant.price;
  const units = packs * product.packSize;
  const bagName = bagColors.find((b) => b.id === bag)?.name ?? bag;
  const inkName = inkColors.find((c) => c.id === ink)?.name ?? ink;
  const summary = `${product.name} · ${variant.size} · bolsa ${bagName} · impresión ${inkName}`;

  function addToCart() {
    if (price == null) return;
    flyToCart(document.querySelector("[data-product-image]"), variant.image ?? product.images[0].src, document.activeElement);
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: variant.image ?? product.images[0].src,
      size: variant.size,
      bagColor: bagName,
      inkColor: inkName,
      quantity: packs,
      packSize: product.packSize,
      unitPrice: price,
    });
    setAdded(true);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <Gallery images={product.images} activeSrc={variant.image} />

      <div>
        <h1 className="font-display text-3xl leading-tight font-black md:text-5xl">{product.name}</h1>
        <p className="mt-3 text-lg text-white/75">{product.short}</p>

        <div className="mt-6 flex items-end gap-3" aria-live="polite">
          {price != null ? (
            <>
              <p className="font-display text-4xl font-black text-gradient">{formatARS(price * packs)}</p>
              <p className="pb-1 text-sm text-mute">
                {units.toLocaleString("es-AR")} unidades impresas{packs > 1 ? ` · ${formatARS(price)} por pack` : ""}
              </p>
            </>
          ) : (
            <p className="font-display text-2xl font-black text-brand-cyan">Precio a cotizar</p>
          )}
        </div>

        {product.variants.length > 1 && (
          <fieldset className="mt-8">
            <legend className="label">Medida (ancho × largo)</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {product.variants.map((v, i) => (
                <button
                  key={v.size}
                  type="button"
                  aria-pressed={vi === i}
                  onClick={() => {
                    setVi(i);
                    router.replace(`?medida=${i}`, { scroll: false });
                  }}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${vi === i ? "border-white bg-white/10" : "border-line hover:border-white/40"}`}
                >
                  <span className="block font-display font-extrabold">{v.size}</span>
                  <span className="text-xs text-mute">{v.price != null ? formatARS(v.price) : "Consultar"}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {product.variants.length === 1 && (
          <p className="mt-6 rounded-2xl border border-line bg-white/5 px-4 py-3 text-sm">
            <span className="font-semibold">{variant.size}</span>
            {variant.detail ? <span className="text-mute"> · {variant.detail}</span> : null}
          </p>
        )}

        {product.colors.length > 1 && (
          <fieldset className="mt-7">
            <legend className="label">Color de bolsa</legend>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((id) => {
                const c = bagColors.find((b) => b.id === id)!;
                return (
                  <button key={id} type="button" aria-pressed={bag === id} onClick={() => setBag(id)} className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${bag === id ? "border-white bg-white/10" : "border-line hover:border-white/40"}`}>
                    <Swatch hex={c.hex} id={id} /> {c.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="mt-7">
          <legend className="label">
            Color de impresión: <span className="font-normal text-mute">{inkName}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {inkColors.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={ink === c.id}
                aria-label={c.name}
                title={c.name}
                onClick={() => setInk(c.id)}
                className={`grid h-11 w-11 place-items-center rounded-full border transition ${ink === c.id ? "border-white bg-white/10" : "border-line hover:border-white/40"}`}
              >
                <Swatch hex={c.hex} id={c.id} />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-mute">El precio incluye impresión a 1 cara y 1 color. ¿Más colores o 2 caras? Consultanos.</p>
        </fieldset>

        {price != null && (
          <div className="mt-7">
            <span className="label" id="packs-label">Cantidad de packs ({product.packSize} u. c/u)</span>
            <div className="inline-flex items-center rounded-full border border-line bg-white/5" role="group" aria-labelledby="packs-label">
              <button type="button" className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/10" onClick={() => setPacks((p) => Math.max(1, p - 1))} aria-label="Restar un pack">
                <IconMinus />
              </button>
              <output className="w-12 text-center font-display text-lg font-extrabold" aria-live="polite">{packs}</output>
              <button type="button" className="grid h-12 w-12 place-items-center rounded-full hover:bg-white/10" onClick={() => setPacks((p) => Math.min(100, p + 1))} aria-label="Sumar un pack">
                <IconPlus />
              </button>
            </div>
          </div>
        )}

        {fromDesigner && (
          <p className="mt-6 rounded-2xl border border-brand-green/40 bg-brand-green/5 px-4 py-3 text-sm">
            <strong className="text-brand-green">✓ Tu diseño del simulador quedó guardado.</strong> Elegí la medida y la cantidad: se adjunta solo a tu pedido.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {price != null ? (
            added ? (
              <Link href="/carrito" className="btn btn-primary">
                <IconCheck /> Agregado · Ver mi pedido
              </Link>
            ) : (
              <button type="button" onClick={addToCart} className="btn btn-primary">
                <IconBag /> Agregar al pedido
              </button>
            )
          ) : null}
          <a href={waLink(`¡Hola Visual Graf! Quiero consultar por: ${summary}${price != null ? ` · ${units} unidades` : ""}.`)} target="_blank" rel="noopener noreferrer" className={`btn ${price != null ? "btn-ghost" : "btn-whatsapp"}`}>
            <IconWhatsApp /> {price != null ? "Consultar por WhatsApp" : "Cotizar por WhatsApp"}
          </a>
          <Link href={`/personalizar?bolsa=${bag}&tinta=${ink}&modelo=${product.category === "hielo" ? "hielo" : product.category === "ecommerce" ? "ecommerce" : "rinon"}`} className="btn btn-ghost">
            <IconBrush /> Probar mi logo
          </Link>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3">
          {product.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-white/85">
              <IconCheck className="mt-0.5 shrink-0 text-brand-green" width={18} height={18} /> {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
