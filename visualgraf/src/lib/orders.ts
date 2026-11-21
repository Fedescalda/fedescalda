import "server-only";
import { getProducts, findPromoCode } from "./data";
import { formatARS } from "./site";
import type { OrderInput } from "./validation";

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
  return { lines, subtotal, discount, total: subtotal - discount, promoCode: promo?.code ?? null };
}

export function orderSummaryText(orderId: string, priced: Awaited<ReturnType<typeof priceOrder>>, customer: OrderInput["customer"]) {
  const lines = priced.lines
    .map((l) => `• ${l.name} ${l.size} · bolsa ${l.bagColor} · impresión ${l.inkColor} · ${l.quantity} pack(s) de ${l.packSize} = ${formatARS(l.quantity * l.unitPrice)}`)
    .join("\n");
  return [
    `¡Hola Visual Graf! Quiero confirmar mi pedido #${orderId}:`,
    lines,
    priced.discount ? `Descuento (${priced.promoCode}): -${formatARS(priced.discount)}` : "",
    `Total: ${formatARS(priced.total)} (sin envío)`,
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
