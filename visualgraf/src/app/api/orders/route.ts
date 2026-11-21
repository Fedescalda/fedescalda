import { after, NextResponse } from "next/server";
import { clientIp, orderSchema, rateLimited } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/server";
import { createPreference, isMercadoPagoEnabled } from "@/lib/mercadopago";
import { orderSummaryText, priceOrder } from "@/lib/orders";
import { transferInfo } from "@/lib/settings";
import { uploadOrderFile } from "@/lib/order-files";
import { sendCustomerEmail } from "@/lib/customer-email";
import type { OrderRow } from "@/lib/order-events";
import { notifyNewOrder } from "@/lib/notify";
import { site, waLink } from "@/lib/site";

/**
 * Crea un pedido. Acepta JSON o multipart/form-data:
 *   - payload: JSON del pedido (ver orderSchema)
 *   - logo:    archivo original del cliente (opcional)
 *   - mockup:  imagen generada en el simulador (opcional)
 */
export async function POST(req: Request) {
  if (rateLimited(`orders:${clientIp(req)}`, 6)) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Probá de nuevo en un minuto." }, { status: 429 });
  }

  let body: unknown;
  let logo: File | null = null;
  let mockup: File | null = null;
  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      body = JSON.parse(String(form.get("payload") ?? "{}"));
      const l = form.get("logo");
      const m = form.get("mockup");
      if (l instanceof File && l.size > 0) logo = l;
      if (m instanceof File && m.size > 0) mockup = m;
    } else {
      body = await req.json();
    }
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

  const sb = createAdminClient();
  const transfer = transferInfo();
  const method =
    input.paymentMethod === "mercadopago" && isMercadoPagoEnabled() && sb
      ? "mercadopago"
      : input.paymentMethod === "transferencia" && transfer && sb
        ? "transferencia"
        : "whatsapp";

  // Sin base de datos: cierre por WhatsApp (modo básico)
  if (!sb) {
    const shortId = crypto.randomUUID().slice(0, 8).toUpperCase();
    after(() => notifyNewOrder({ shortId, customer: input.customer, lines: priced.lines, total: priced.total, discount: priced.discount, promoCode: priced.promoCode, paymentMethod: "whatsapp" }));
    return NextResponse.json({ ok: true, orderId: shortId, redirectUrl: null, whatsappUrl: waLink(orderSummaryText(shortId, priced, input.customer)) });
  }

  const { data, error } = await sb
    .from("orders")
    .insert({
      customer: input.customer,
      items: priced.lines,
      subtotal: priced.subtotal,
      discount: priced.discount,
      shipping: priced.shipping,
      shipping_zone: priced.shippingZone,
      total: priced.total,
      promo_code: priced.promoCode,
      payment_method: method,
      history: [{ status: "pendiente", at: new Date().toISOString(), note: "Pedido creado en la web" }],
    })
    .select("*")
    .single();
  if (error || !data) {
    console.error("[orders] insert error", error?.message);
    return NextResponse.json({ ok: false, error: "No pudimos registrar tu pedido. Probá de nuevo o escribinos por WhatsApp." }, { status: 500 });
  }
  const order = data as OrderRow;
  const shortId = order.id.slice(0, 8).toUpperCase();

  // Archivos del diseño (si falla la subida, el pedido sigue: se pueden subir después)
  const patch: Record<string, string> = {};
  try {
    if (logo) patch.logo_path = await uploadOrderFile(order.id, "logo", logo);
    if (mockup) patch.mockup_path = await uploadOrderFile(order.id, "mockup", mockup);
    if (Object.keys(patch).length) await sb.from("orders").update(patch).eq("id", order.id);
  } catch (e) {
    console.error("[orders] upload", e);
  }

  after(async () => {
    await notifyNewOrder({ shortId, customer: input.customer, lines: priced.lines, total: priced.total, discount: priced.discount, promoCode: priced.promoCode, paymentMethod: method === "mercadopago" ? "mercadopago" : "whatsapp" });
    await sendCustomerEmail(order, "pendiente", { transfer });
  });

  const pageUrl = `/pedido/${order.access_token}`;
  if (method === "mercadopago") {
    try {
      const lines = priced.discount || priced.shipping
        ? [{ id: "pedido", title: `Pedido Visual Graf #${shortId} (${priced.lines.length} producto/s${priced.shipping ? " + envío" : ""})`, quantity: 1, unitPrice: priced.total }]
        : priced.lines.map((l) => ({ id: l.productId, title: `${l.name} ${l.size} · ${l.bagColor} / ${l.inkColor} (pack ${l.packSize} u.)`, quantity: l.quantity, unitPrice: l.unitPrice }));
      const pref = await createPreference({ orderId: order.id, token: order.access_token, payer: { name: input.customer.name, email: input.customer.email }, lines });
      await sb.from("orders").update({ mp_preference_id: pref.id }).eq("id", order.id);
      return NextResponse.json({ ok: true, orderId: shortId, redirectUrl: pref.initPoint, pageUrl });
    } catch (e) {
      console.error("[orders] Mercado Pago error", e);
      return NextResponse.json({ ok: true, orderId: shortId, redirectUrl: null, pageUrl, warning: "No pudimos abrir Mercado Pago. Podés reintentar el pago desde la página de tu pedido." });
    }
  }
  return NextResponse.json({ ok: true, orderId: shortId, redirectUrl: null, pageUrl, siteUrl: site.url });
}
