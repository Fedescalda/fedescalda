import { NextResponse } from "next/server";
import { z } from "zod";
import { getProducts } from "@/lib/data";
import { parcelFor } from "@/lib/orders";
import { quoteShipping } from "@/lib/settings";
import { clientIp, provinces, rateLimited } from "@/lib/validation";

const schema = z.object({
  province: z.enum(provinces),
  cp: z.string().max(10).optional().default(""),
  discountPercent: z.number().min(0).max(90).optional().default(0),
  items: z.array(z.object({ productId: z.string().max(60), size: z.string().max(80), quantity: z.number().int().min(1).max(100) })).max(30),
});

/** Cotiza el envío del carrito (precios y pesos se toman del catálogo, no del cliente). */
export async function POST(req: Request) {
  if (rateLimited(`ship:${clientIp(req)}`, 30)) return NextResponse.json({ price: null, zone: null, free: false }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ price: null, zone: null, free: false });
  const { province, cp, items, discountPercent } = parsed.data;

  const products = await getProducts();
  const lines = items.map((i) => {
    const variant = products.find((p) => p.id === i.productId)?.variants.find((v) => v.size === i.size);
    return { quantity: i.quantity, variant, price: variant?.price ?? 0 };
  });
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  const net = subtotal - Math.round((subtotal * discountPercent) / 100);
  return NextResponse.json(await quoteShipping(province, net, { cp, parcel: parcelFor(lines) }));
}
