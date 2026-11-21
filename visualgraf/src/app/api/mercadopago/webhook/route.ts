import { NextResponse } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";
import { getPayment } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/server";

const statusMap: Record<string, string> = {
  approved: "pagado",
  rejected: "cancelado",
  cancelled: "cancelado",
  refunded: "cancelado",
};

export async function POST(req: Request) {
  const url = new URL(req.url);
  let body: { type?: string; data?: { id?: string } } = {};
  try {
    body = await req.json();
  } catch {}
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const paymentId = body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // Verificación de firma (configurá MP_WEBHOOK_SECRET en producción)
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers.get("x-signature"),
        xRequestId: req.headers.get("x-request-id"),
        dataId: url.searchParams.get("data.id") ?? paymentId,
        secret,
        toleranceSeconds: 600,
      });
    } catch {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  if (type !== "payment" || !paymentId) return NextResponse.json({ ok: true });

  try {
    // Nunca confiamos en el cuerpo: consultamos el pago a Mercado Pago
    const payment = await getPayment(String(paymentId));
    const orderId = payment.external_reference;
    const status = statusMap[payment.status ?? ""];
    const sb = createAdminClient();
    if (sb && orderId && status) {
      await sb.from("orders").update({ status, mp_payment_id: String(payment.id) }).eq("id", orderId);
    }
  } catch (e) {
    console.error("[mp-webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
