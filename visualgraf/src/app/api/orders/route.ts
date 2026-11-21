import { NextResponse } from "next/server";
import { clientIp, orderSchema, rateLimited } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/server";
import { createPreference, isMercadoPagoEnabled } from "@/lib/mercadopago";
import { orderSummaryText, priceOrder } from "@/lib/orders";
import { waLink } from "@/lib/site";

export async function POST(req: Request) {
  if (rateLimited(`orders:${clientIp(req)}`, 6)) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Probá de nuevo en un minuto." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos" }, { status: 400 });
  }
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: false, error: "Error" }, { status: 400 });

  let priced;
  try {
    priced = await priceOrder(input);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Error de precios" }, { status: 409 });
  }

  const useMP = input.paymentMethod === "mercadopago" && isMercadoPagoEnabled();
  const sb = createAdminClient();
  let orderId: string = crypto.randomUUID();

  if (sb) {
    const { data, error } = await sb
      .from("orders")
      .insert({
        customer: input.customer,
        items: priced.lines,
        subtotal: priced.subtotal,
        discount: priced.discount,
        total: priced.total,
        promo_code: priced.promoCode,
        payment_method: useMP ? "mercadopago" : "whatsapp",
      })
      .select("id")
      .single();
    if (error) console.error("[orders] insert error", error.message);
    else orderId = data.id;
  }
  const shortId = orderId.slice(0, 8).toUpperCase();
  const whatsappUrl = waLink(orderSummaryText(shortId, priced, input.customer));

  if (useMP) {
    try {
      const factor = priced.subtotal ? priced.total / priced.subtotal : 1;
      const pref = await createPreference({
        orderId,
        payer: { name: input.customer.name, email: input.customer.email, phone: input.customer.phone },
        lines: priced.lines.map((l) => ({
          id: l.productId,
          title: `${l.name} ${l.size} · ${l.bagColor} / ${l.inkColor} (pack ${l.packSize} u.)`,
          quantity: l.quantity,
          unitPrice: l.unitPrice * factor,
        })),
      });
      if (sb) await sb.from("orders").update({ mp_preference_id: pref.id }).eq("id", orderId);
      return NextResponse.json({ ok: true, orderId: shortId, redirectUrl: pref.initPoint, whatsappUrl });
    } catch (e) {
      console.error("[orders] Mercado Pago error", e);
      return NextResponse.json({ ok: true, orderId: shortId, redirectUrl: null, whatsappUrl, warning: "No pudimos abrir Mercado Pago. Confirmá tu pedido por WhatsApp." });
    }
  }

  return NextResponse.json({ ok: true, orderId: shortId, redirectUrl: null, whatsappUrl });
}
