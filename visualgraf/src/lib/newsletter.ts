import "server-only";
import { z } from "zod";
import { site } from "./site";
import { createAdminClient } from "./supabase/server";

export const subscriberSchema = z.object({
  email: z.string().trim().max(254).email("Ingresá un email válido."),
  name: z.string().trim().max(80).optional(),
  source: z.string().trim().max(60).optional().transform((value) => value || "web"),
});

type Subscriber = { email: string; name: string | null; unsubscribe_token: string };
export type Campaign = {
  subject: string;
  preheader: string | null;
  body: string;
  image: string | null;
  cta_label: string | null;
  cta_url: string | null;
};
type SubscribeResult =
  | { ok: false; already: false }
  | { ok: true; already: true }
  | { ok: true; already: false; subscriber: Subscriber };

const subscriberFields = "email,name,unsubscribe_token";
const sender = () => process.env.NEWSLETTER_FROM || process.env.CUSTOMER_EMAIL_FROM;

export const newsletterEnabled = () => Boolean(process.env.RESEND_API_KEY && sender());

export async function subscribe({ email, name, source }: { email: string; name?: string; source: string }): Promise<SubscribeResult> {
  const supabase = createAdminClient();
  if (!supabase) return { ok: false, already: false };

  const values = { email: email.trim().toLowerCase(), name: name || null, source };
  // El índice único usa lower(email), por lo que PostgREST no puede inferirlo con onConflict: "email".
  const { data: inserted, error } = await supabase.from("subscribers").insert(values).select(subscriberFields).single();
  if (inserted) return { ok: true, already: false, subscriber: inserted };
  if (error?.code !== "23505") return { ok: false, already: false };

  const pattern = values.email.replace(/[\\%_]/g, "\\$&");
  const existing = await supabase.from("subscribers").select("id,status").ilike("email", pattern).maybeSingle();
  if (!existing.data) return { ok: false, already: false };
  if (existing.data.status === "activo") return { ok: true, already: true };

  const reactivated = await supabase.from("subscribers").update({
    ...values,
    status: "activo",
    consent_at: new Date().toISOString(),
    unsubscribed_at: null,
    unsubscribe_token: crypto.randomUUID().replace(/-/g, ""),
  }).eq("id", existing.data.id).eq("status", "baja").select(subscriberFields).maybeSingle();

  if (reactivated.error) return { ok: false, already: false };
  if (!reactivated.data) return { ok: true, already: true };
  return { ok: true, already: false, subscriber: reactivated.data };
}

export const validUnsubscribeToken = (token: string) => /^[a-f0-9]{32}$/.test(token);

export async function unsubscribe(token: string) {
  const supabase = createAdminClient();
  if (!validUnsubscribeToken(token) || !supabase) return false;

  const { error } = await supabase.from("subscribers")
    .update({ status: "baja", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token).eq("status", "activo");
  return !error;
}

const esc = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
);

export function campaignUrl(value: string | null) {
  const url = value?.trim();
  if (!url || /[\\\u0000-\u001f\u007f]/.test(url)) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return new URL(url, site.url).href;
  try {
    const absolute = new URL(url);
    return absolute.protocol === "https:" && !absolute.username && !absolute.password ? absolute.href : null;
  } catch {
    return null;
  }
}

export function renderCampaign(campaign: Campaign, unsubscribeUrl: string) {
  const image = campaignUrl(campaign.image);
  const cta = campaignUrl(campaign.cta_url);
  const body = esc(campaign.body.replace(/\r\n?/g, "\n")).split(/\n(?:[^\S\n]*\n)+/)
    .map((paragraph) => `<p style="line-height:1.55">${paragraph.replace(/\n/g, "<br>")}</p>`).join("");

  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111;background:#fff">
    ${campaign.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(campaign.preheader)}</div>` : ""}
    <div style="background:#07070d;padding:20px 24px;border-radius:16px 16px 0 0"><span style="color:#fff;font-size:20px;font-weight:900">VISUAL GRAF</span><br><span style="color:#a6a6c0;font-size:10px;letter-spacing:4px">TU BOLSA IMPRESA</span></div>
    <div style="height:4px;background:#6a24d9;background:linear-gradient(90deg,#34d3f3,#3a64ff,#9b33f5,#ff2e93,#ff7a1c,#ffc61f)"></div>
    <div style="padding:24px;border:1px solid #eee;border-top:0;border-radius:0 0 16px 16px">
      <h2 style="margin:0 0 16px">${esc(campaign.subject)}</h2>
      ${image ? `<img src="${esc(image)}" alt="" style="display:block;width:100%;height:auto;border-radius:12px">` : ""}
      ${body}
      ${cta && campaign.cta_label ? `<p style="margin:22px 0"><a href="${esc(cta)}" style="display:inline-block;background:#6a24d9;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${esc(campaign.cta_label)}</a></p>` : ""}
      <p style="color:#666;font-size:12px;margin-top:24px">Recibís este email porque te suscribiste en Visual Graf.<br><a href="${esc(unsubscribeUrl)}">Darme de baja</a></p>
    </div>
  </div>`;
}

function message(campaign: Campaign, email: string, token?: string) {
  return {
    from: sender(),
    to: [email],
    subject: campaign.subject,
    html: renderCampaign(campaign, `${site.url}/baja/${token ?? "preview"}`),
    ...(token && { headers: {
      "List-Unsubscribe": `<${site.url}/api/newsletter?baja=${token}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    } }),
  };
}

async function resend(payload: ReturnType<typeof message> | ReturnType<typeof message>[], idempotencyKey?: string) {
  if (!newsletterEnabled()) return false;
  const base = (process.env.RESEND_API_URL || "https://api.resend.com/emails").replace(/\/$/, "");
  const url = Array.isArray(payload) ? (base.endsWith("/batch") ? base : `${base}/batch`) : base.replace(/\/batch$/, "");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) console.error("[newsletter] Resend", response.status);
    return response.ok;
  } catch {
    console.error("[newsletter] No se pudo conectar con Resend");
    return false;
  }
}

export async function sendWelcome(sub: Subscriber) {
  await resend(message({
    subject: "¡Te damos la bienvenida a Visual Graf!",
    preheader: "Ya estás en nuestra lista de novedades.",
    body: `${sub.name ? `¡Hola, ${sub.name}!` : "¡Hola!"}\n\nGracias por sumarte. Te vamos a mandar novedades, promos y fechas clave para tu negocio.`,
    image: null,
    cta_label: "Conocé nuestras bolsas",
    cta_url: "/productos",
  }, sub.email, sub.unsubscribe_token));
}

export async function sendCampaignTest(campaign: Campaign, email: string) {
  return resend({ ...message(campaign, email), subject: `[Prueba] ${campaign.subject}` });
}

export async function sendCampaign(campaignId: string, expectedRecipients?: number) {
  const supabase = createAdminClient();
  if (!supabase || !newsletterEnabled()) throw new Error("Falta configurar Supabase o Resend.");

  const recipients: Subscriber[] = [];
  let lastId: string | undefined;
  for (;;) {
    const query = supabase.from("subscribers").select(`id,${subscriberFields}`)
      .eq("status", "activo").order("id").limit(100);
    const { data, error } = await (lastId ? query.gt("id", lastId) : query);
    if (error) throw new Error("No pudimos leer los suscriptores.");
    recipients.push(...data);
    if (data.length < 100) break;
    lastId = data[data.length - 1].id;
  }
  if (!recipients.length) throw new Error("No hay suscriptores activos.");
  if (expectedRecipients !== undefined && recipients.length !== expectedRecipients) {
    throw new Error("Cambió la cantidad de suscriptores activos. Volvé a confirmar el envío.");
  }

  // La actualización condicional reserva el borrador antes de llamar a Resend.
  const { data: campaign, error } = await supabase.from("campaigns").update({ status: "enviando" })
    .eq("id", campaignId).eq("status", "borrador").select("*").maybeSingle();
  if (error || !campaign) throw new Error("La campaña ya no está disponible como borrador.");

  let sent = 0;
  for (let offset = 0; offset < recipients.length; offset += 100) {
    const batch = recipients.slice(offset, offset + 100)
      .map((sub) => message(campaign, sub.email, sub.unsubscribe_token));
    if (await resend(batch, `newsletter-${campaignId}-${offset}`)) sent += batch.length;
  }

  const { error: finalizeError } = await supabase.from("campaigns").update({
    status: "enviada",
    recipients: sent,
    sent_at: new Date().toISOString(),
  }).eq("id", campaignId).eq("status", "enviando").select("id").single();
  if (finalizeError) throw new Error(`Resend aceptó ${sent} emails, pero no pudimos cerrar la campaña.`);
  return { sent, failed: recipients.length - sent };
}
