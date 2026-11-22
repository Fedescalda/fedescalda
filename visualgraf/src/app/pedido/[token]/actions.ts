"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOrderByToken, setOrderStatus } from "@/lib/order-events";
import { uploadOrderFile } from "@/lib/order-files";
import { createPreference, isMercadoPagoEnabled } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";
import { site } from "@/lib/site";
import { rateLimited } from "@/lib/validation";

/** Límite por pedido: evita que se inunden los avisos al dueño o el storage. */
const tooMany = (token: string, action: string) => rateLimited(`pedido:${action}:${token}`, 5, 10 * 60_000);

export type CustomerActionResult = { error?: string; success?: string };

const adminUrl = (id: string) => `${site.url}/admin/pedidos/${id}`;
const short = (id: string) => id.slice(0, 8).toUpperCase();

export async function approveProof(token: string, _s: CustomerActionResult, form: FormData): Promise<CustomerActionResult> {
  const order = await getOrderByToken(token);
  if (!order) return { error: "Pedido no encontrado." };
  if (order.proof_status !== "enviada" || !order.proof_path) return { error: "No hay una prueba de diseño pendiente de aprobar." };
  if (!["pendiente", "pagado", "diseno"].includes(order.status)) return { error: "Este pedido ya no admite aprobar pruebas. Escribinos por WhatsApp." };
  // La versión que el cliente vio tiene que ser la vigente (evita aprobar una prueba vieja)
  if (String(form.get("version")) !== String(order.proof_version ?? 0)) {
    return { error: "Hay una versión más nueva de la prueba. Recargá la página para verla antes de aprobar." };
  }
  if (form.get("check_texts") !== "on" || form.get("check_print") !== "on") {
    return { error: "Marcá las dos confirmaciones para aprobar el diseño." };
  }
  const sb = createAdminClient()!;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;

  // Copia inmutable de la versión aprobada (respaldo ante cualquier reclamo)
  const ext = order.proof_path.split(".").pop() || "png";
  const approvedPath = `${order.id}/aprobada-v${order.proof_version ?? 0}-${Date.now()}.${ext}`;
  const { error: copyError } = await sb.storage.from("pedidos").copy(order.proof_path, approvedPath);

  const now = new Date().toISOString();
  const { data: approved, error } = await sb
    .from("orders")
    .update({
      proof_status: "aprobada",
      proof_feedback: null,
      proof_approved_at: now,
      proof_approved_ip: ip,
      proof_approved_path: copyError ? order.proof_path : approvedPath,
    })
    .eq("id", order.id)
    .eq("proof_status", "enviada")
    .eq("proof_version", order.proof_version ?? 0)
    .in("status", ["pendiente", "pagado", "diseno"])
    .select("id");
  if (error) return { error: "No pudimos registrar la aprobación. Probá de nuevo." };
  // otra pestaña, un doble clic o una prueba nueva ganaron la carrera: no repetir cambios ni avisos
  if (!approved?.length) return { error: "La prueba cambió mientras la mirabas. Recargá la página para ver su estado." };

  const note = `Diseño aprobado por el cliente (prueba v${order.proof_version ?? 0}) · ${new Date(now).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`;
  // Sin pago acreditado no pasa a producción: queda aprobado y se produce cuando se confirme el pago.
  if (order.status === "pendiente") {
    const kept = await setOrderStatus(order.id, "pendiente", { note, email: false, from: "pendiente", notifyOwner: "🎨 El cliente aprobó el diseño (pago pendiente)" });
    revalidatePath(`/pedido/${token}`);
    if (kept) return { success: "¡Diseño aprobado! Lo pasamos a producción cuando se confirme el pago." };
    // el pago entró justo ahora: sigue el camino normal
    const fresh = await getOrderByToken(token);
    if (!fresh || !["pagado", "diseno"].includes(fresh.status)) return { success: "¡Diseño aprobado! Te avisamos cuando pase a producción." };
    order.status = fresh.status;
  }
  const moved = await setOrderStatus(order.id, "en_produccion", { note, from: order.status, notifyOwner: "🎨 El cliente aprobó el diseño" });
  revalidatePath(`/pedido/${token}`);
  if (!moved) return { success: "¡Diseño aprobado! Te avisamos cuando pase a producción." };
  return { success: "¡Diseño aprobado! Pasamos tu pedido a producción." };
}

export async function requestChanges(token: string, _s: CustomerActionResult, form: FormData): Promise<CustomerActionResult> {
  const order = await getOrderByToken(token);
  if (!order) return { error: "Pedido no encontrado." };
  if (order.proof_status !== "enviada") return { error: "No hay una prueba de diseño pendiente." };
  if (String(form.get("version")) !== String(order.proof_version ?? 0)) {
    return { error: "Hay una versión más nueva de la prueba. Recargá la página para verla." };
  }
  if (tooMany(token, "cambios")) return { error: "Recibimos varios pedidos de cambio seguidos. Esperá unos minutos o escribinos por WhatsApp." };
  const feedback = String(form.get("feedback") ?? "").trim().slice(0, 1500);
  if (feedback.length < 5) return { error: "Contanos qué cambios querés." };
  const sb = createAdminClient()!;
  const history = [...(order.history ?? []), { status: order.status, at: new Date().toISOString(), note: `El cliente pidió cambios: ${feedback}` }];
  const { data: changed } = await sb.from("orders").update({ proof_status: "cambios", proof_feedback: feedback, history })
    .eq("id", order.id).eq("proof_status", "enviada").eq("proof_version", order.proof_version ?? 0).select("id");
  if (!changed?.length) return { error: "Esta prueba ya fue respondida. Recargá la página." };
  await notify({
    subject: `✏️ Cambios pedidos en el diseño · #${short(order.id)}`,
    lines: [`${order.customer.name} pidió cambios:`, feedback],
    link: { label: "Abrir pedido", url: adminUrl(order.id) },
  });
  revalidatePath(`/pedido/${token}`);
  return { success: "Recibimos tus cambios. Te mandamos una nueva prueba." };
}

export async function uploadLogo(token: string, _s: CustomerActionResult, form: FormData): Promise<CustomerActionResult> {
  const order = await getOrderByToken(token);
  if (!order) return { error: "Pedido no encontrado." };
  if (["enviado", "entregado", "cancelado"].includes(order.status)) return { error: "Este pedido ya no admite cambios de logo." };
  if (tooMany(token, "logo")) return { error: "Subiste varios archivos seguidos. Esperá unos minutos y probá de nuevo." };
  const file = form.get("logo");
  if (!(file instanceof File) || !file.size) return { error: "Elegí el archivo de tu logo." };
  try {
    const path = await uploadOrderFile(order.id, "logo", file);
    await createAdminClient()!.from("orders").update({ logo_path: path }).eq("id", order.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No pudimos subir el archivo." };
  }
  await notify({ subject: `📎 Logo recibido · #${short(order.id)}`, lines: [`${order.customer.name} subió su logo.`], link: { label: "Abrir pedido", url: adminUrl(order.id) } });
  revalidatePath(`/pedido/${token}`);
  return { success: "¡Logo recibido!" };
}

export async function payAgain(token: string): Promise<CustomerActionResult> {
  const order = await getOrderByToken(token);
  if (!order || order.status !== "pendiente" || order.payment_method !== "mercadopago" || !isMercadoPagoEnabled()) {
    return { error: "Este pedido no tiene un pago pendiente con Mercado Pago." };
  }
  let url: string | undefined;
  try {
    const pref = await createPreference({
      orderId: order.id,
      token,
      payer: { name: order.customer.name, email: order.customer.email },
      lines: [{ id: "pedido", title: `Pedido Visual Graf #${short(order.id)}`, quantity: 1, unitPrice: Number(order.total) }],
    });
    url = pref.initPoint;
  } catch {
    return { error: "No pudimos abrir Mercado Pago. Probá de nuevo en unos minutos." };
  }
  if (!url) return { error: "No pudimos abrir Mercado Pago." };
  redirect(url);
}
