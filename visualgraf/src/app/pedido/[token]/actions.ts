"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrderByToken, setOrderStatus } from "@/lib/order-events";
import { uploadOrderFile } from "@/lib/order-files";
import { createPreference, isMercadoPagoEnabled } from "@/lib/mercadopago";
import { createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";
import { site } from "@/lib/site";

export type CustomerActionResult = { error?: string; success?: string };

const adminUrl = (id: string) => `${site.url}/admin/pedidos/${id}`;
const short = (id: string) => id.slice(0, 8).toUpperCase();

export async function approveProof(token: string): Promise<CustomerActionResult> {
  const order = await getOrderByToken(token);
  if (!order) return { error: "Pedido no encontrado." };
  if (order.proof_status !== "enviada") return { error: "No hay una prueba de diseño pendiente de aprobar." };
  const sb = createAdminClient()!;
  await sb.from("orders").update({ proof_status: "aprobada", proof_feedback: null }).eq("id", order.id);
  await setOrderStatus(order.id, "en_produccion", { note: "Diseño aprobado por el cliente", notifyOwner: "🎨 El cliente aprobó el diseño" });
  revalidatePath(`/pedido/${token}`);
  return { success: "¡Diseño aprobado! Pasamos tu pedido a producción." };
}

export async function requestChanges(token: string, _s: CustomerActionResult, form: FormData): Promise<CustomerActionResult> {
  const order = await getOrderByToken(token);
  if (!order) return { error: "Pedido no encontrado." };
  if (order.proof_status !== "enviada") return { error: "No hay una prueba de diseño pendiente." };
  const feedback = String(form.get("feedback") ?? "").trim().slice(0, 1500);
  if (feedback.length < 5) return { error: "Contanos qué cambios querés." };
  const sb = createAdminClient()!;
  const history = [...(order.history ?? []), { status: order.status, at: new Date().toISOString(), note: `El cliente pidió cambios: ${feedback}` }];
  await sb.from("orders").update({ proof_status: "cambios", proof_feedback: feedback, history }).eq("id", order.id);
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
