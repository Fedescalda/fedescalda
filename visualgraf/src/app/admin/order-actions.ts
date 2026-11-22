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

  const saved = await setOrderStatus(id, status, {
    note,
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

  const { data: order } = await supabase.from("orders").select("status").eq("id", id).maybeSingle();
  if (!order) return { error: "No pudimos abrir el pedido." };

  let path: string;
  try {
    path = await uploadOrderFile(id, "prueba", file);
  } catch {
    return { error: "No pudimos subir la prueba. Intentá de nuevo." };
  }

  const saved = await setOrderStatus(id, "diseno", {
    note: "Prueba de diseño enviada",
    patch: { proof_path: path, proof_status: "enviada", proof_feedback: null },
  });
  if (!saved) return { error: "No pudimos guardar la prueba en el pedido. Intentá de nuevo." };

  // El cambio de estado no genera un email cuando se reemplaza una prueba en diseño.
  if (order.status === "diseno") {
    const updated = await getOrderById(id);
    if (updated?.proof_path === path && updated.status === "diseno") await sendCustomerEmail(updated, "prueba");
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
