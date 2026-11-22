"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/components/admin/ActionForm";
import { sendCustomerEmail } from "@/lib/customer-email";
import { getOrderById, setOrderStatus } from "@/lib/order-events";
import { MAX_ORDER_FILE, ORDER_FILE_TYPES, uploadOrderFile } from "@/lib/order-files";
import { isOrderStatus } from "@/lib/order-status";
import type { ShippingConfig } from "@/lib/settings";
import { provinces } from "@/lib/validation";
import { getAdminClient } from "./session";
import { createAdminClient } from "@/lib/supabase/server";

const denied = { error: "No tenés permisos para hacer este cambio." };

function refreshOrder(id: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/pedido/[token]", "page");
}

const statusForm = z.object({
  status: z.string(),
  note: z.string().trim().max(1000),
  carrier: z.string().trim().max(120),
  tracking_code: z.string().trim().max(120),
});

export async function changeOrderStatus(id: string, _state: ActionResult, form: FormData): Promise<ActionResult> {
  if (!await getAdminClient()) return denied;

  const input = statusForm.safeParse(Object.fromEntries(form));
  if (!input.success) return { error: "Revisá el estado y el largo de la nota y los datos de seguimiento." };
  const { status, note, carrier, tracking_code } = input.data;
  if (!isOrderStatus(status)) return { error: "Elegí un estado válido." };

  // Regla de negocio: no se produce ni se despacha sin la aprobación del diseño
  const current = await getOrderById(id);
  if (!current) return { error: "No pudimos abrir el pedido." };
  const needsApproval = ["en_produccion", "enviado", "entregado"].includes(status);
  const offlineApproval = form.get("offline_approval") === "on";
  if (needsApproval && current.proof_status !== "aprobada" && !offlineApproval) {
    return {
      error:
        "El cliente todavía no aprobó el diseño. Subí la prueba y esperá su aprobación, o marcá \"El cliente aprobó por otro medio\" si lo confirmó por WhatsApp o email.",
    };
  }
  if (needsApproval && current.proof_status !== "aprobada" && offlineApproval) {
    const supabase = await getAdminClient();
    await supabase!.from("orders").update({ proof_status: "aprobada", proof_approved_at: new Date().toISOString(), proof_approved_ip: "aprobación fuera de la web" }).eq("id", id);
  }

  const saved = await setOrderStatus(id, status, {
    note: [note, needsApproval && current.proof_status !== "aprobada" && offlineApproval ? "Diseño aprobado por el cliente fuera de la web (registrado por el admin)" : ""].filter(Boolean).join(" · "),
    patch: { carrier: carrier || null, tracking_code: tracking_code || null },
    email: form.get("email") === "on",
  });
  if (!saved) return { error: "No pudimos actualizar el pedido." };

  refreshOrder(id);
  return { success: "Estado actualizado." };
}

export async function uploadProof(id: string, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const file = form.get("proof");
  if (!(file instanceof File) || file.size === 0) return { error: "Elegí un archivo para subir." };
  if (file.size > MAX_ORDER_FILE) return { error: "El archivo supera los 4 MB." };
  if (!ORDER_FILE_TYPES.includes(file.type)) return { error: "Usá PNG, JPG, WEBP, SVG o PDF." };

  const { data: order } = await supabase.from("orders").select("status, proof_version, proof_status").eq("id", id).maybeSingle();
  if (order?.proof_status === "aprobada") return { error: "El cliente ya aprobó una prueba. Si hay que cambiarla, coordinalo con el cliente antes." };
  if (!order) return { error: "No pudimos abrir el pedido." };

  let path: string;
  try {
    path = await uploadOrderFile(id, "prueba", file);
  } catch {
    return { error: "No pudimos subir la prueba. Intentá de nuevo." };
  }

  const version = (order.proof_version ?? 0) + 1;
  // Un pedido sin pagar sigue "pendiente": la prueba se envía igual, pero no se saltea el pago.
  const next = order.status === "pendiente" ? "pendiente" : "diseno";
  const saved = await setOrderStatus(id, next, {
    note: `Prueba de diseño v${version} enviada`,
    patch: { proof_path: path, proof_status: "enviada", proof_feedback: null, proof_version: version },
    from: order.status,
    match: { proof_version: order.proof_version ?? 0 },
  });
  if (!saved) return { error: "No pudimos guardar la prueba (¿cambió el estado del pedido mientras tanto?). Recargá e intentá de nuevo." };

  // Sin cambio de estado no sale el email automático: se manda el de la prueba.
  if (order.status === next) {
    const updated = await getOrderById(id);
    if (updated?.proof_path === path && updated.status === next) await sendCustomerEmail(updated, "prueba");
  }

  refreshOrder(id);
  return { success: "Prueba de diseño guardada." };
}

const optionalPrice = z.string().trim()
  .transform((value) => value === "" ? null : Number(value))
  .pipe(z.number().finite().nonnegative().nullable());

const shippingForm = z.object({
  enabled: z.boolean(),
  provider: z.enum(["zonas", "andreani"]),
  markupPercent: z.coerce.number().min(0).max(200),
  freeFrom: optionalPrice,
  zones: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
    name: z.string().trim().min(1).max(80),
    price: optionalPrice,
    provinces: z.array(z.enum(provinces)),
  })),
});

export async function saveShipping(_state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const parsed = shippingForm.safeParse({
    enabled: form.get("enabled") === "on",
    provider: form.get("provider") === "andreani" ? "andreani" : "zonas",
    markupPercent: form.get("markupPercent") || 0,
    freeFrom: form.get("freeFrom"),
    zones: form.getAll("zone").map((id) => ({
      id,
      name: form.get(`name-${id}`),
      price: form.get(`price-${id}`),
      provinces: form.getAll(`provinces-${id}`),
    })),
  });
  if (!parsed.success) return { error: "Completá el nombre de cada zona y revisá los importes y las provincias." };

  const config: ShippingConfig = parsed.data;
  const ids = config.zones.map((zone) => zone.id);
  if (new Set(ids).size !== ids.length) return { error: "Hay zonas repetidas. Recargá la página e intentá de nuevo." };
  const assigned = config.zones.flatMap((zone) => zone.provinces);
  const duplicate = assigned.find((province, index) => assigned.indexOf(province) !== index);
  if (duplicate) return { error: `Dejá ${duplicate} en una sola zona.` };

  const { error } = await supabase.from("settings").upsert({
    key: "shipping",
    value: config,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "No pudimos guardar la configuración de envíos." };

  revalidatePath("/carrito");
  revalidatePath("/admin/configuracion");
  return { success: "Configuración guardada." };
}

/** Envía la muestra digital que generó el cliente en el simulador como prueba de diseño. */
export async function sendMockupAsProof(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;
  const order = await getOrderById(id);
  if (!order) return { error: "No pudimos abrir el pedido." };
  if (!order.mockup_path) return { error: "Este pedido no tiene una muestra del simulador." };
  if (order.proof_status === "aprobada") return { error: "El cliente ya aprobó una prueba." };

  const storage = createAdminClient()?.storage;
  if (!storage) return { error: "Storage no configurado." };
  const ext = order.mockup_path.split(".").pop() || "jpg";
  const path = `${id}/prueba-muestra-${Date.now()}.${ext}`;
  const { error } = await storage.from("pedidos").copy(order.mockup_path, path);
  if (error) return { error: "No pudimos copiar la muestra." };

  const version = (order.proof_version ?? 0) + 1;
  const next = order.status === "pendiente" ? "pendiente" : "diseno";
  const saved = await setOrderStatus(id, next, {
    note: `Muestra digital del simulador enviada como prueba v${version}`,
    patch: { proof_path: path, proof_status: "enviada", proof_feedback: null, proof_version: version },
    from: order.status,
    match: { proof_version: order.proof_version ?? 0 },
  });
  if (!saved) return { error: "No pudimos guardar la prueba (¿cambió el estado del pedido mientras tanto?). Recargá e intentá de nuevo." };
  if (order.status === next) {
    const updated = await getOrderById(id);
    if (updated) await sendCustomerEmail(updated, "prueba");
  }
  refreshOrder(id);
  return { success: "Muestra enviada al cliente para aprobar." };
}
