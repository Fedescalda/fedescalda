import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { OrderFile } from "@/components/admin/order/OrderFile";
import type { OrderRow } from "@/lib/order-events";
import { ORDER_FILE_TYPES } from "@/lib/order-files";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";
import { formatARS } from "@/lib/site";
import type { OrderInput } from "@/lib/validation";
import { formatDate, orderStatusColors, orderWhatsApp, paymentLabels } from "../../../display";
import { changeOrderStatus, uploadProof } from "../../../order-actions";
import { getPanelClient } from "../../../session";

type PanelOrder = OrderRow & {
  customer: OrderInput["customer"];
  mp_payment_id: string | null;
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { id } = await params;
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) notFound();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) return <p role="alert">No pudimos cargar el pedido. Recargá la página e intentá de nuevo.</p>;
  if (!data) notFound();

  const order = data as PanelOrder;
  const { customer } = order;
  const number = id.slice(0, 8).toUpperCase();
  const address = [customer.address, customer.city, customer.province, customer.zip && `CP ${customer.zip}`].filter(Boolean).join(", ");
  const whatsapp = orderWhatsApp(customer.phone ?? "", `Hola ${customer.name}, te escribimos de Visual Graf por tu pedido #${number}.`);
  const customerDetails = [
    ["Nombre", customer.name], ["Email", customer.email], ["Teléfono", customer.phone],
    ["CUIT", customer.cuit], ["Negocio", customer.business], ["Dirección", address], ["Notas", customer.notes],
  ];
  const shipping = !order.shipping && order.shipping_zone == null ? "A coordinar" : formatARS(order.shipping);
  const history = [...(order.history ?? [])].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <Link href="/admin" className="btn btn-ghost">Volver a pedidos</Link>
        <h1 className="text-3xl font-bold">Pedido #{number}</h1>
        <p className={orderStatusColors[order.status]}>{statusLabel[order.status] ?? order.status}</p>
        <time className="block text-sm text-mute" dateTime={order.created_at}>{formatDate(order.created_at)}</time>
        {order.access_token && <Link href={`/pedido/${order.access_token}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Ver como el cliente</Link>}
      </header>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card min-w-0 space-y-3 p-4 sm:p-5">
          <h2 className="text-xl font-bold">Cliente</h2>
          <dl className="space-y-2">
            {customerDetails.map(([label, value]) => (
              <div key={label} className="grid gap-1 sm:grid-cols-[6rem_minmax(0,1fr)]">
                <dt className="text-mute">{label}</dt><dd className="whitespace-pre-wrap break-words">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">WhatsApp</a>}
            {customer.email && <a href={`mailto:${customer.email}`} className="btn btn-ghost">Enviar email</a>}
          </div>
        </section>
        <section className="card min-w-0 space-y-3 p-4 sm:p-5">
          <h2 className="text-xl font-bold">Ítems y pago</h2>
          <ul className="divide-y divide-white/10">
            {order.items.map((item, index) => (
              <li key={index} className="flex flex-wrap justify-between gap-2 py-2">
                <div className="min-w-0 break-words">
                  <p className="font-semibold">{item.name} · {item.size}</p>
                  <p className="text-sm text-mute">Bolsa {item.bagColor} · Tinta {item.inkColor} · {item.quantity} packs × {item.packSize} unidades</p>
                </div>
                <p>{formatARS(item.quantity * item.unitPrice)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-white/10 pt-3">
            <div className="flex flex-wrap justify-between gap-x-3"><dt>Subtotal</dt><dd>{formatARS(order.subtotal)}</dd></div>
            <div className="flex flex-wrap justify-between gap-x-3"><dt>Descuento</dt><dd>{formatARS(-(order.discount || 0))}</dd></div>
            <div className="flex flex-wrap justify-between gap-x-3"><dt>Envío{order.shipping_zone && ` · ${order.shipping_zone}`}</dt><dd>{shipping}</dd></div>
            <div className="flex flex-wrap justify-between gap-x-3 font-bold"><dt>Total</dt><dd>{formatARS(order.total)}</dd></div>
            <div className="flex flex-wrap justify-between gap-x-3"><dt>Método de pago</dt><dd>{paymentLabels[order.payment_method] ?? order.payment_method}</dd></div>
            <div className="flex flex-wrap justify-between gap-x-3"><dt>ID de pago de Mercado Pago</dt><dd className="break-all">{order.mp_payment_id || "—"}</dd></div>
          </dl>
        </section>
        <section className="card min-w-0 space-y-4 p-4 sm:p-5">
          <h2 className="text-xl font-bold">Archivos del cliente</h2>
          <OrderFile title="Logo del cliente" path={order.logo_path} empty="El cliente todavía no subió su logo" />
          <OrderFile title="Mockup del simulador" path={order.mockup_path} empty="Todavía no hay un mockup." />
        </section>
        <section className="card min-w-0 space-y-4 p-4 sm:p-5">
          <h2 className="text-xl font-bold">Prueba de diseño</h2>
          <p>Estado: {order.proof_status ?? "pendiente"}</p>
          {order.proof_status === "cambios" && order.proof_feedback && (
            <div><h3 className="font-semibold">Cambios que pidió el cliente</h3><p className="whitespace-pre-wrap break-words">{order.proof_feedback}</p></div>
          )}
          <OrderFile title="Prueba actual" path={order.proof_path} empty="Todavía no subiste una prueba." />
          <ActionForm action={uploadProof.bind(null, id)} label="Subir y enviar prueba" resetOnSuccess>
            <label className="block">
              <span className="label">Archivo de la prueba</span>
              <input name="proof" className="field" type="file" required accept={ORDER_FILE_TYPES.join(",")} />
            </label>
          </ActionForm>
        </section>
        <section className="card min-w-0 space-y-4 p-4 sm:p-5">
          <h2 className="text-xl font-bold">Cambiar estado</h2>
          <ActionForm action={changeOrderStatus.bind(null, id)} label="Guardar estado">
            <label className="block">
              <span className="label">Estado</span>
              <select key={order.status} name="status" className="field" defaultValue={order.status}>
                {ORDER_STATUSES.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Nota (opcional)</span>
              <textarea name="note" className="field" rows={2} maxLength={1000} />
            </label>
            <label className="block">
              <span className="label">Transportista</span>
              <input key={order.carrier} name="carrier" className="field" defaultValue={order.carrier ?? ""} maxLength={120} />
            </label>
            <label className="block">
              <span className="label">Código de seguimiento</span>
              <input key={order.tracking_code} name="tracking_code" className="field" defaultValue={order.tracking_code ?? ""} maxLength={120} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="email" defaultChecked />
              Avisar al cliente por email
            </label>
          </ActionForm>
        </section>
        <section className="card min-w-0 space-y-4 p-4 sm:p-5">
          <h2 className="text-xl font-bold">Historial</h2>
          {history.length === 0 && <p className="text-mute">Todavía no hay cambios registrados.</p>}
          <ol className="space-y-3">
            {history.map(({ status, at, note }, index) => (
              <li key={`${at}-${index}`} className="border-l-2 border-white/20 pl-3">
                <p className="font-semibold">{statusLabel[status] ?? status}</p>
                <time className="text-sm text-mute" dateTime={at}>{formatDate(at)}</time>
                {note && <p className="whitespace-pre-wrap break-words">{note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
