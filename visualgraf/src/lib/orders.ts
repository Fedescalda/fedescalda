import "server-only";
import { getProducts, findPromoCode } from "./data";
import { formatARS } from "./site";
import type { OrderInput } from "./validation";
import { quoteShipping } from "./settings";

export type PricedLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  bagColor: string;
  inkColor: string;
  quantity: number;
  packSize: number;
  unitPrice: number;
};

/** Peso y volumen total del pedido; null si algún producto no tiene esos datos cargados. */
export function parcelFor(lines: { quantity: number; variant?: { kilos?: number | null; volumen?: number | null } }[]) {
  let kilos = 0;
  let volumen = 0;
  for (const l of lines) {
    if (!l.variant?.kilos || !l.variant?.volumen) return null;
    kilos += l.variant.kilos * l.quantity;
    volumen += l.variant.volumen * l.quantity;
  }
  return kilos > 0 ? { kilos, volumen } : null;
}

/** Recalcula precios en el servidor a partir del catálogo: nunca confiamos en precios del cliente. */
export async function priceOrder(input: OrderInput) {
  const products = await getProducts();
  const lines: PricedLine[] = [];
  for (const it of input.items) {
    const p = products.find((x) => x.id === it.productId);
    const v = p?.variants.find((x) => x.size === it.size);
    if (!p || !v || v.price == null) throw new Error(`El producto "${it.size}" ya no está disponible. Actualizá tu pedido.`);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: v.image ?? p.images[0]?.src ?? "",
      size: v.size,
      bagColor: it.bagColor,
      inkColor: it.inkColor,
      quantity: it.quantity,
      packSize: p.packSize,
      unitPrice: v.price,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const promo = input.promoCode ? await findPromoCode(input.promoCode) : null;
  const discount = promo?.discountPercent ? Math.round((subtotal * promo.discountPercent) / 100) : 0;
  const ship = await quoteShipping(input.customer.province, subtotal - discount, {
    cp: input.customer.zip,
    parcel: parcelFor(lines.map((l) => ({ ...l, variant: products.find((p) => p.id === l.productId)?.variants.find((v) => v.size === l.size) }))),
  });
  const shipping = ship.price ?? 0;
  return {
    lines,
    subtotal,
    discount,
    shipping,
    shippingZone: ship.price == null ? null : ship.zone,
    total: subtotal - discount + shipping,
    promoCode: promo?.code ?? null,
  };
}

export function orderSummaryText(orderId: string, priced: Awaited<ReturnType<typeof priceOrder>>, customer: OrderInput["customer"]) {
  const lines = priced.lines
    .map((l) => `• ${l.name} ${l.size} · bolsa ${l.bagColor} · impresión ${l.inkColor} · ${l.quantity} pack(s) de ${l.packSize} = ${formatARS(l.quantity * l.unitPrice)}`)
    .join("\n");
  return [
    `¡Hola Visual Graf! Quiero confirmar mi pedido #${orderId}:`,
    lines,
    priced.discount ? `Descuento (${priced.promoCode}): -${formatARS(priced.discount)}` : "",
    priced.shippingZone ? `Envío (${priced.shippingZone}): ${priced.shipping ? formatARS(priced.shipping) : "gratis"}` : "Envío: a coordinar",
    `Total: ${formatARS(priced.total)}`,
    "",
    `Nombre: ${customer.name}${customer.business ? ` (${customer.business})` : ""}`,
    `Envío a: ${customer.address}, ${customer.city}, ${customer.province}${customer.zip ? ` (CP ${customer.zip})` : ""}`,
    customer.notes ? `Notas: ${customer.notes}` : "",
    "",
    "Les envío mi logo por acá.",
  ]
    .filter((x) => x !== "")
    .join("\n");
}
