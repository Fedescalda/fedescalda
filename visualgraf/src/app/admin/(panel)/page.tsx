import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import type { OrderRow } from "@/lib/order-events";
import { isOrderStatus, ORDER_STATUSES } from "@/lib/order-status";
import { formatARS } from "@/lib/site";
import { sendTestNotification } from "../actions";
import { notificationChannels } from "@/lib/notify";
import { formatDate, orderStatusColors, orderStatuses, paymentLabels } from "../display";
import { getPanelClient } from "../session";

type OrderSummary = Pick<OrderRow, "id" | "created_at" | "customer" | "total" | "payment_method" | "status" | "logo_path" | "mockup_path" | "proof_status">;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ estado?: string | string[] }> }) {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { estado } = await searchParams;
  const status = typeof estado === "string" && isOrderStatus(estado) ? estado : null;
  let query = supabase.from("orders")
    .select("id, created_at, customer, total, payment_method, status, logo_path, mockup_path, proof_status")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  const orders = (data ?? []) as OrderSummary[];

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Pedidos</h1>
      <NotificationsCard />
      <nav aria-label="Filtrá por estado" className="flex flex-wrap gap-2">
        {[null, ...ORDER_STATUSES].map((value) => (
          <Link key={value ?? "todos"} href={value ? `/admin?estado=${value}` : "/admin"}
            className={value === status ? "btn btn-primary" : "btn btn-ghost"}
            aria-current={value === status ? "page" : undefined}>
            {value ? orderStatuses[value] : "Todos"}
          </Link>
        ))}
      </nav>
      {error && <p role="alert">No pudimos cargar los pedidos.</p>}
      {!error && !orders.length && <p className="text-mute">{status ? "No hay pedidos con ese estado." : "Todavía no hay pedidos."}</p>}
      {orders.map((order) => {
        const number = order.id.slice(0, 8).toUpperCase();
        const hasLogo = Boolean(order.logo_path || order.mockup_path);
        return (
          <article key={order.id} className="card grid items-start gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="min-w-0 space-y-1 break-words">
              <h2 className="font-bold">Pedido #{number}</h2>
              <time className="text-sm text-mute" dateTime={order.created_at}>{formatDate(order.created_at)}</time>
              <p>{order.customer?.name || "Cliente sin nombre"}</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold">{formatARS(order.total)}</p>
              <p className="text-sm text-mute">{paymentLabels[order.payment_method] ?? order.payment_method}</p>
              <p className={orderStatusColors[order.status]}>{orderStatuses[order.status] ?? order.status}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p><span aria-hidden="true">Logo {hasLogo ? "✓" : "✗"}</span><span className="sr-only">{hasLogo ? "Logo disponible" : "Sin logo"}</span></p>
              <p>Diseño: {order.proof_status ?? "pendiente"}</p>
            </div>
            <Link href={`/admin/pedidos/${order.id}`} className="btn btn-ghost justify-self-start" aria-label={`Abrir pedido #${number}`}>Abrir</Link>
          </article>
        );
      })}
    </section>
  );
}

function NotificationsCard() {
  const ch = notificationChannels();
  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <span className="font-semibold">Avisos de pedidos y consultas:</span>{" "}
        <span className={ch.email ? "text-brand-green" : "text-mute"}>Email {ch.email ? "activo" : "sin configurar"}</span>
        {" · "}
        <span className={ch.telegram ? "text-brand-green" : "text-mute"}>Celular (Telegram) {ch.telegram ? "activo" : "sin configurar"}</span>
      </p>
      <ActionForm action={sendTestNotification} label="Probar avisos" secondary />
    </div>
  );
}
