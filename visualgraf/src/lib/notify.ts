import "server-only";
import { formatARS, site } from "./site";

/**
 * Avisos al dueño cuando entra un pedido, se acredita un pago o llega una consulta.
 * Canales (cada uno se activa solo si tiene sus variables de entorno):
 *  - Email con Resend:   RESEND_API_KEY + NOTIFY_EMAIL (+ NOTIFY_FROM opcional)
 *  - Celular (Telegram): TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 * Nunca rompe el flujo del cliente: los errores se registran y se ignoran.
 */

const RESEND_URL = process.env.RESEND_API_URL || "https://api.resend.com/emails";
const TELEGRAM_URL = process.env.TELEGRAM_API_URL || "https://api.telegram.org";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function notificationChannels() {
  return {
    email: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  };
}

type Message = {
  subject: string;
  /** Líneas en texto plano (se escapan) */
  lines: string[];
  /** Botón principal (ej. abrir WhatsApp del cliente o el panel) */
  link?: { label: string; url: string };
  replyTo?: string;
};

async function withTimeout(p: Promise<Response>, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

async function sendEmail(m: Message) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
      <div style="height:4px;background:linear-gradient(90deg,#34d3f3,#3a64ff,#9b33f5,#ff2e93,#ff7a1c,#ffc61f)"></div>
      <h2 style="margin:20px 0 12px">${esc(m.subject)}</h2>
      ${m.lines.map((l) => (l ? `<p style="margin:4px 0;line-height:1.5">${esc(l)}</p>` : "<br>")).join("")}
      ${m.link ? `<p style="margin:24px 0"><a href="${esc(m.link.url)}" style="background:#6a24d9;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold">${esc(m.link.label)}</a></p>` : ""}
      <p style="color:#888;font-size:12px;margin-top:28px">Aviso automático de ${esc(site.displayName)} · ${esc(site.url)}</p>
    </div>`;
  const res = await withTimeout(
    fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Visual Graf <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        subject: m.subject,
        html,
        text: [...m.lines, m.link ? `${m.link.label}: ${m.link.url}` : ""].join("\n"),
        ...(m.replyTo && { reply_to: m.replyTo }),
      }),
    }),
  );
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function sendTelegram(m: Message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const text = [`<b>${esc(m.subject)}</b>`, "", ...m.lines.map(esc)].join("\n").slice(0, 4000);
  const res = await withTimeout(
    fetch(`${TELEGRAM_URL}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(m.link && { reply_markup: { inline_keyboard: [[{ text: m.link.label, url: m.link.url }]] } }),
      }),
    }),
  );
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function notify(m: Message) {
  while (m.lines.length && !m.lines[m.lines.length - 1]) m.lines.pop();
  const results = await Promise.allSettled([sendEmail(m), sendTelegram(m)]);
  results.forEach((r) => r.status === "rejected" && console.error("[notify]", r.reason));
}

/* ───────── Mensajes ───────── */

const phoneLink = (phone?: string) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  const intl = digits.startsWith("54") ? digits : `549${digits.replace(/^0/, "")}`;
  return `https://wa.me/${intl}`;
};

type OrderLine = { name: string; size: string; bagColor: string; inkColor: string; quantity: number; packSize: number; unitPrice: number };

export function notifyNewOrder(o: {
  shortId: string;
  customer: { name: string; email: string; phone: string; business?: string; city: string; province: string; address: string; notes?: string };
  lines: OrderLine[];
  total: number;
  discount: number;
  promoCode: string | null;
  paymentMethod: "mercadopago" | "whatsapp";
}) {
  const wa = phoneLink(o.customer.phone);
  return notify({
    subject: `🛍️ Nuevo pedido #${o.shortId} · ${formatARS(o.total)}`,
    lines: [
      `Cliente: ${o.customer.name}${o.customer.business ? ` (${o.customer.business})` : ""}`,
      `WhatsApp: ${o.customer.phone} · Email: ${o.customer.email}`,
      `Envío: ${o.customer.address}, ${o.customer.city}, ${o.customer.province}`,
      "",
      ...o.lines.map((l) => `• ${l.name} ${l.size} · bolsa ${l.bagColor} · impresión ${l.inkColor} · ${l.quantity}×${l.packSize} u. = ${formatARS(l.quantity * l.unitPrice)}`),
      o.discount ? `Descuento ${o.promoCode ?? ""}: -${formatARS(o.discount)}` : "",
      `Total: ${formatARS(o.total)} (sin envío)`,
      `Pago: ${o.paymentMethod === "mercadopago" ? "Mercado Pago (te aviso cuando se acredite)" : "a coordinar por WhatsApp"}`,
      o.customer.notes ? `Notas: ${o.customer.notes}` : "",
    ].filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i > 0)),
    link: wa ? { label: "Escribirle por WhatsApp", url: wa } : { label: "Ver pedidos", url: `${site.url}/admin` },
    replyTo: o.customer.email,
  });
}

export function notifyOrderPaid(o: { orderId: string; total: number; customerName?: string }) {
  return notify({
    subject: `✅ Pago acreditado · pedido #${o.orderId.slice(0, 8).toUpperCase()}`,
    lines: [`${o.customerName ? `${o.customerName} pagó` : "Se acreditó el pago de"} ${formatARS(o.total)} con Mercado Pago.`, "Ya podés coordinar el diseño y la producción."],
    link: { label: "Ver pedidos", url: `${site.url}/admin` },
  });
}

export function notifyNewContact(c: { name: string; business?: string; email: string; phone?: string; province?: string; interest?: string; message: string }) {
  const wa = phoneLink(c.phone);
  return notify({
    subject: `💬 Nueva consulta de ${c.name}${c.business ? ` (${c.business})` : ""}`,
    lines: [
      `Email: ${c.email}${c.phone ? ` · Tel: ${c.phone}` : ""}`,
      c.province ? `Provincia: ${c.province}` : "",
      c.interest ? `Le interesa: ${c.interest}` : "",
      "",
      c.message,
    ].filter((l, i) => l !== "" || i === 3),
    link: wa ? { label: "Responder por WhatsApp", url: wa } : { label: "Responder por email", url: `mailto:${c.email}` },
    replyTo: c.email,
  });
}
