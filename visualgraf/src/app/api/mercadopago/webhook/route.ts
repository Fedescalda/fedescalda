import { after, NextResponse } from "next/server";
import { notifyOrderPaid } from "@/lib/notify";
import { WebhookSignatureValidator } from "mercadopago";
import { getPayment } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Webhook de Mercado Pago.
 * - Exige firma válida (MP_WEBHOOK_SECRET) y usa solo el ID firmado (query `data.id`).
 * - Consulta el pago a Mercado Pago (nunca confía en el cuerpo).
 * - Verifica que el pedido exista, sea de Mercado Pago, en ARS y por el importe esperado.
 * - Transiciones idempotentes: un rechazo posterior no cancela un pedido ya pagado.
 */
export async function POST(req: Request) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ ok: false, error: "Webhook no configurado" }, { status: 503 });
  }

  const url = new URL(req.url);
  const signedId = url.searchParams.get("data.id");
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let body: { type?: string; data?: { id?: string | number } } = {};
  try {
    body = await req.json();
  } catch {}

  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId: signedId,
      secret,
      toleranceSeconds: 600,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!signedId || (body.data?.id != null && String(body.data.id) !== signedId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if ((type ?? body.type) !== "payment") return NextResponse.json({ ok: true });

  const sb = createAdminClient();
  if (!sb) return NextResponse.json({ ok: false }, { status: 503 });

  let payment;
  try {
    payment = await getPayment(signedId);
  } catch (e) {
    console.error("[mp-webhook] no se pudo consultar el pago", e);
    return NextResponse.json({ ok: false }, { status: 502 }); // MP reintenta
  }

  const orderId = payment.external_reference;
  if (!orderId) return NextResponse.json({ ok: true });

  const { data: order, error } = await sb.from("orders").select("id,total,status,payment_method,mp_payment_id,customer").eq("id", orderId).maybeSingle();
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  if (!order) return NextResponse.json({ ok: true }); // pedido inexistente: no reintentar
  if (order.payment_method !== "mercadopago") return NextResponse.json({ ok: true });

  const paidCents = Math.round(Number(payment.transaction_amount ?? 0) * 100);
  const expectedCents = Math.round(Number(order.total) * 100);
  const amountOk = payment.currency_id === "ARS" && Math.abs(paidCents - expectedCents) <= 100; // tolerancia $1 por redondeo

  let update: Record<string, string> | null = null;
  if (payment.status === "approved") {
    if (!amountOk) {
      console.error(`[mp-webhook] importe no coincide para pedido ${orderId}: ${paidCents} vs ${expectedCents}`);
      return NextResponse.json({ ok: true });
    }
    if (order.status === "pendiente" || order.status === "cancelado") update = { status: "pagado", mp_payment_id: String(payment.id) };
  } else if (payment.status === "refunded" || payment.status === "charged_back") {
    // Solo revierte si es el mismo pago que acreditó el pedido
    if (order.mp_payment_id === String(payment.id)) update = { status: "cancelado" };
  }
  // rejected / cancelled / pending: no cambian un pedido (el cliente puede reintentar con otro medio)

  if (update) {
    const { error: upErr } = await sb.from("orders").update(update).eq("id", orderId);
    if (upErr) return NextResponse.json({ ok: false }, { status: 500 });
    if (update.status === "pagado") {
      const customerName = (order.customer as { name?: string } | null)?.name;
      after(() => notifyOrderPaid({ orderId: order.id, total: Number(order.total), customerName }));
    }
  }
  return NextResponse.json({ ok: true });
}
