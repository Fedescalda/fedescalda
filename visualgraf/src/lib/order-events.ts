import "server-only";
import { createAdminClient } from "./supabase/server";
import { sendCustomerEmail, type EmailOrder } from "./customer-email";
import { notify } from "./notify";
import { formatARS, site } from "./site";
import { statusLabel, type HistoryEntry, type OrderStatus } from "./order-status";

export type OrderRow = EmailOrder & {
  history: HistoryEntry[];
  proof_status: string;
  proof_path: string | null;
  logo_path: string | null;
  mockup_path: string | null;
  proof_feedback: string | null;
  proof_version: number;
  proof_approved_at: string | null;
  proof_approved_ip: string | null;
  proof_approved_path: string | null;
  terms_accepted_at: string | null;
  design: Record<string, unknown> | null;
  shipping_zone: string | null;
  created_at: string;
};

export async function getOrderById(id: string) {
  const sb = createAdminClient();
  if (!sb) return null;
  const { data } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  return (data as OrderRow | null) ?? null;
}

export async function getOrderByToken(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const sb = createAdminClient();
  if (!sb) return null;
  const { data } = await sb.from("orders").select("*").eq("access_token", token).maybeSingle();
  return (data as OrderRow | null) ?? null;
}

/**
 * Cambia el estado de un pedido, lo registra en el historial y avisa al cliente por email.
 * Devuelve false si no se pudo guardar.
 */
export async function setOrderStatus(
  id: string,
  status: OrderStatus,
  opts: { note?: string; patch?: Record<string, unknown>; email?: boolean; notifyOwner?: string } = {},
) {
  const sb = createAdminClient();
  if (!sb) return false;
  const order = await getOrderById(id);
  if (!order) return false;
  const history = [...(order.history ?? []), { status, at: new Date().toISOString(), ...(opts.note && { note: opts.note }) }];
  const { data, error } = await sb
    .from("orders")
    .update({ status, history, updated_at: new Date().toISOString(), ...opts.patch })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) return false;
  const updated = data as OrderRow;
  if (opts.email !== false && status !== order.status) await sendCustomerEmail(updated, status);
  if (opts.notifyOwner) {
    await notify({
      subject: opts.notifyOwner,
      lines: [`Pedido #${id.slice(0, 8).toUpperCase()} · ${updated.customer.name} · ${formatARS(updated.total)}`, `Estado: ${statusLabel[status]}`, opts.note ?? ""],
      link: { label: "Abrir pedido", url: `${site.url}/admin/pedidos/${id}` },
    });
  }
  return true;
}
