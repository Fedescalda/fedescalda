"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/components/admin/ActionForm";
import type { Variant } from "@/lib/catalog";
import { createSessionClient } from "@/lib/supabase/server";
import { orderStatuses } from "./display";
import { getAdminClient } from "./session";
import { notificationChannels, notify } from "@/lib/notify";

const denied = { error: "No tenés permisos para hacer este cambio." };

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function priceValue(value: string) {
  return value === "" ? null : Number(value);
}

function validPrice(value: number | null) {
  return value === null || (Number.isFinite(value) && value >= 0);
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase?.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}

export async function updateOrderStatus(id: string, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const status = field(form, "status");
  if (!Object.hasOwn(orderStatuses, status)) return { error: "Elegí un estado válido." };

  const { error } = await supabase.from("orders").update({ status }).eq("id", id).select("id").single();
  if (error) return { error: "No pudimos actualizar el pedido." };
  revalidatePath("/admin");
  return { success: "Estado actualizado." };
}

export async function markAnswered(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const { error } = await supabase.from("contact_messages").update({ status: "respondido" }).eq("id", id).select("id").single();
  if (error) return { error: "No pudimos marcar la consulta como respondida." };
  revalidatePath("/admin/consultas");
  return { success: "Consulta marcada como respondida." };
}

export async function updateProduct(id: string, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const name = field(form, "name");
  if (!name) return { error: "Ingresá el nombre del producto." };

  const { data: product, error: readError } = await supabase.from("products").select("variants, updated_at").eq("id", id).single();
  if (readError || !product) return { error: "No pudimos leer el producto." };
  if (product.updated_at !== field(form, "updated_at")) {
    return { error: "El producto cambió. Recargá la página antes de editarlo." };
  }

  const variants = (product.variants as Variant[]).map((variant, index) => ({
    ...variant,
    size: field(form, `size-${index}`),
    price: priceValue(field(form, `price-${index}`)),
  }));
  if (variants.some(({ size, price }) => !size || !validPrice(price))) {
    return { error: "Completá cada tamaño e ingresá precios válidos o dejalos vacíos para cotizar." };
  }

  const { error } = await supabase.from("products").update({
    name,
    short: field(form, "short"),
    description: field(form, "description"),
    features: field(form, "features").split(/\r?\n/).map((feature) => feature.trim()).filter(Boolean),
    variants,
    featured: form.has("featured"),
    active: form.has("active"),
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("updated_at", product.updated_at).select("id").single();

  if (error) return { error: "No pudimos guardar el producto. Recargá la página e intentá de nuevo." };
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/productos/[slug]", "page");
  revalidatePath("/admin/productos");
  return { success: "Producto guardado." };
}

function isSitePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

function validLink(value: string) {
  if (!value || isSitePath(value)) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function savePromotion(id: string | null, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const title = field(form, "title");
  const price = priceValue(field(form, "price"));
  const endsAt = field(form, "ends_at");
  const image = field(form, "image");
  const cta = field(form, "cta");

  if (!title) return { error: "Ingresá un título." };
  if (!validPrice(price)) return { error: "Ingresá un precio válido o dejalo vacío." };
  const date = new Date(endsAt);
  if (endsAt && (!/^\d{4}-\d{2}-\d{2}$/.test(endsAt) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== endsAt)) {
    return { error: "Ingresá una fecha de finalización válida." };
  }
  if (image && !isSitePath(image)) return { error: "Ingresá una ruta de imagen del sitio, como /img/promo.webp." };
  if (!validLink(cta)) return { error: "Ingresá una ruta del sitio o un enlace HTTPS para el botón." };

  const values = {
    title,
    description: field(form, "description"),
    badge: field(form, "badge") || "Promo",
    price,
    price_note: field(form, "price_note") || null,
    image: image || null,
    cta: cta || null,
    ends_at: endsAt || null,
    active: form.has("active"),
  };
  const query = id
    ? supabase.from("promotions").update(values).eq("id", id)
    : supabase.from("promotions").insert(values);
  const { error } = await query.select("id").single();

  if (error) return { error: "No pudimos guardar la promoción." };
  refreshPromotions();
  return { success: id ? "Promoción guardada." : "Promoción creada." };
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const { error } = await supabase.from("promotions").delete().eq("id", id).select("id").single();
  if (error) return { error: "No pudimos borrar la promoción." };
  refreshPromotions();
  return { success: "Promoción borrada." };
}

function refreshPromotions() {
  revalidatePath("/admin/promociones");
  revalidatePath("/promociones");
  revalidatePath("/");
}

export async function sendTestNotification(): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;
  const ch = notificationChannels();
  if (!ch.email && !ch.telegram) {
    return { error: "No hay avisos configurados. Cargá RESEND_API_KEY + NOTIFY_EMAIL y/o TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID." };
  }
  await notify({ subject: "🔔 Prueba de avisos de Visual Graf", lines: ["Si ves este mensaje, los avisos de pedidos y consultas funcionan."] });
  return { success: `Aviso de prueba enviado por ${[ch.email && "email", ch.telegram && "Telegram"].filter(Boolean).join(" y ")}. Revisá que te haya llegado.` };
}
