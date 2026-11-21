import "server-only";
import { formatARS, site, waLink } from "./site";
import { statusLabel, statusText, type OrderStatus } from "./order-status";

/**
 * Emails automáticos al CLIENTE (Resend).
 * Requiere RESEND_API_KEY y CUSTOMER_EMAIL_FROM con un dominio verificado en Resend
 * (ej. "Visual Graf <pedidos@vgtubolsaimpresa.store>"). Sin eso, no se envían (y no rompe nada).
 */
export const customerEmailsEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.CUSTOMER_EMAIL_FROM);

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type EmailOrder = {
  id: string;
  access_token: string;
  status: OrderStatus;
  customer: { name: string; email: string };
  items: { name: string; size: string; bagColor: string; inkColor: string; quantity: number; packSize: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  carrier?: string | null;
  tracking_code?: string | null;
};

export type EmailKind = OrderStatus | "prueba";

const subjects: Record<EmailKind, (n: string) => string> = {
  pendiente: (n) => `Recibimos tu pedido #${n}`,
  pagado: (n) => `¡Pago acreditado! Pedido #${n}`,
  diseno: (n) => `Tu diseño está listo para aprobar · Pedido #${n}`,
  prueba: (n) => `Tu diseño está listo para aprobar · Pedido #${n}`,
  en_produccion: (n) => `Tus bolsas están en producción · Pedido #${n}`,
  enviado: (n) => `¡Tu pedido #${n} está en camino!`,
  entregado: (n) => `Pedido #${n} entregado`,
  cancelado: (n) => `Pedido #${n} cancelado`,
};

export async function sendCustomerEmail(order: EmailOrder, kind: EmailKind, extra?: { transfer?: { alias: string; cbu: string; holder: string; bank: string } | null }) {
  if (!customerEmailsEnabled()) return;
  const n = order.id.slice(0, 8).toUpperCase();
  const url = `${site.url}/pedido/${order.access_token}`;
  const status: OrderStatus = kind === "prueba" ? "diseno" : kind;
  const first = order.customer.name.split(" ")[0];

  const rows = order.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} ${esc(i.size)}<br><span style="color:#777;font-size:12px">Bolsa ${esc(i.bagColor)} · impresión ${esc(i.inkColor)} · ${i.quantity}×${i.packSize} u.</span></td><td style="padding:6px 0;text-align:right;white-space:nowrap">${esc(formatARS(i.quantity * i.unitPrice))}</td></tr>`)
    .join("");
  const transfer =
    kind === "pendiente" && order.payment_method === "transferencia" && extra?.transfer
      ? `<div style="background:#f4f1ff;border-radius:12px;padding:16px;margin:18px 0"><b>Datos para transferir ${esc(formatARS(order.total))}</b><br>Alias: <b>${esc(extra.transfer.alias)}</b>${extra.transfer.cbu ? `<br>CBU/CVU: ${esc(extra.transfer.cbu)}` : ""}${extra.transfer.holder ? `<br>Titular: ${esc(extra.transfer.holder)}` : ""}${extra.transfer.bank ? `<br>Banco: ${esc(extra.transfer.bank)}` : ""}<br><span style="color:#666;font-size:13px">Cuando transfieras, subí el comprobante desde el botón de abajo o respondé este mail.</span></div>`
      : "";
  const tracking =
    kind === "enviado" && (order.tracking_code || order.carrier)
      ? `<p style="background:#eefbf3;border-radius:12px;padding:14px">Envío por <b>${esc(order.carrier || "transporte")}</b>${order.tracking_code ? ` · Código de seguimiento: <b>${esc(order.tracking_code)}</b>` : ""}</p>`
      : "";
  const cta = kind === "prueba" || kind === "diseno" ? "Ver y aprobar mi diseño" : "Ver mi pedido";

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <div style="background:#07070d;padding:20px 24px;border-radius:16px 16px 0 0"><span style="color:#fff;font-size:20px;font-weight:900">VISUAL GRAF</span><br><span style="color:#a6a6c0;font-size:10px;letter-spacing:4px">TU BOLSA IMPRESA</span></div>
    <div style="height:4px;background:linear-gradient(90deg,#34d3f3,#3a64ff,#9b33f5,#ff2e93,#ff7a1c,#ffc61f)"></div>
    <div style="padding:24px;border:1px solid #eee;border-top:0;border-radius:0 0 16px 16px">
      <p style="color:#666;margin:0">Pedido #${n} · ${esc(statusLabel[status])}</p>
      <h2 style="margin:8px 0 12px">¡Hola ${esc(first)}!</h2>
      <p style="line-height:1.55">${esc(statusText[status])}</p>
      ${transfer}${tracking}
      <p style="margin:22px 0"><a href="${esc(url)}" style="background:#6a24d9;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${cta}</a></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1px solid #eee;margin-top:10px">${rows}
        ${order.discount ? `<tr><td style="padding:6px 0;color:#1a7f3c">Descuento</td><td style="text-align:right;color:#1a7f3c">-${esc(formatARS(order.discount))}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#666">Envío</td><td style="text-align:right;color:#666">${order.shipping ? esc(formatARS(order.shipping)) : "A coordinar"}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold;border-top:1px solid #eee">Total</td><td style="text-align:right;font-weight:bold;border-top:1px solid #eee">${esc(formatARS(order.total))}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px">¿Dudas? Respondé este mail o escribinos por <a href="${esc(waLink(`Hola, consulta por mi pedido #${n}`))}">WhatsApp</a>.</p>
    </div></div>`;

  try {
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CUSTOMER_EMAIL_FROM,
        to: [order.customer.email],
        reply_to: process.env.NOTIFY_EMAIL || site.email,
        subject: subjects[kind](n),
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[customer-email]", res.status, (await res.text()).slice(0, 200));
  } catch (e) {
    console.error("[customer-email]", e);
  }
}
