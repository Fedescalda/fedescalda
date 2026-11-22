"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/ActionForm";
import { campaignUrl, sendCampaign, sendCampaignTest, subscribe, subscriberSchema } from "@/lib/newsletter";
import { getAdminClient } from "./session";

const path = "/admin/newsletter";
const denied = { error: "No tenés permisos para hacer este cambio." };
const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const link = optionalText(2048).refine((value) => !value || campaignUrl(value));
const schema = z.object({
  subject: z.string().trim().min(1).max(200),
  preheader: optionalText(250),
  body: z.string().trim().min(1).max(30_000),
  image: link,
  cta_label: optionalText(100),
  cta_url: link,
}).refine((values) => Boolean(values.cta_label) === Boolean(values.cta_url));

export async function addSubscriber(_state: ActionResult, form: FormData): Promise<ActionResult> {
  if (!await getAdminClient()) return denied;

  if (form.get("consent") !== "on") return { error: "Confirmá que tenés el consentimiento del suscriptor." };
  const parsed = subscriberSchema.safeParse({ email: form.get("email"), name: form.get("name") ?? undefined, source: "admin" });
  if (!parsed.success) return { error: "Revisá el email y el nombre." };
  const result = await subscribe(parsed.data);
  if (!result.ok) return { error: "No pudimos agregar el suscriptor." };
  revalidatePath(path);
  return { success: result.already ? "Ese email ya está suscripto." : "Suscriptor agregado." };
}

export async function saveCampaign(id: string | null, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Revisá el asunto y el cuerpo. Usá enlaces HTTPS o rutas del sitio y completá ambos campos del botón si lo querés incluir." };

  const query = id
    ? supabase.from("campaigns").update(parsed.data).eq("id", id).eq("status", "borrador")
    : supabase.from("campaigns").insert(parsed.data);
  const { data, error } = await query.select("id").single();
  if (error) return { error: "No pudimos guardar el borrador." };

  revalidatePath(path);
  if (!id) redirect(`${path}?campana=${data.id}`);
  return { success: "Borrador guardado." };
}

export async function testCampaign(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const email = process.env.NOTIFY_EMAIL;
  if (!email) return { error: "Configurá NOTIFY_EMAIL para recibir la prueba." };

  const { data } = await supabase.from("campaigns").select("*").eq("id", id).eq("status", "borrador").maybeSingle();
  if (!data) return { error: "No encontramos el borrador." };

  return await sendCampaignTest(data, email)
    ? { success: "Prueba enviada. Revisá tu correo." }
    : { error: "No pudimos enviar la prueba. Revisá la configuración de Resend." };
}

export async function publishCampaign(id: string, expectedRecipients: number): Promise<ActionResult> {
  if (!await getAdminClient()) return denied;

  let failed: number;
  try {
    ({ failed } = await sendCampaign(id, expectedRecipients));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No pudimos enviar la campaña." };
  } finally {
    revalidatePath(path);
  }
  redirect(`${path}?campana=${id}&fallidos=${failed}`);
}
