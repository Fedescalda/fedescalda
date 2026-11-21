import { ActionForm } from "@/components/admin/ActionForm";
import type { CartItem } from "@/components/cart/CartProvider";
import { formatARS } from "@/lib/site";
import { updateOrderStatus } from "../actions";
import { customerWhatsApp, formatDate, orderStatuses } from "../display";
import { getPanelClient } from "../session";

type Order = {
  id: string;
  created_at: string;
  customer: { name?: string; phone?: string; city?: string; province?: string };
  items: Pick<CartItem, "name" | "size" | "bagColor" | "inkColor" | "quantity" | "packSize">[];
  total: number;
  payment_method: string;
  status: string;
};

const paymentLabels: Record<string, string> = { mercadopago: "Mercado Pago", whatsapp: "WhatsApp" };

export default async function OrdersPage() {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("orders")
    .select("id, created_at, customer, items, total, payment_method, status")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Pedidos</h1>
      {error && <p role="alert">No pudimos cargar los pedidos.</p>}
      {!error && !orders.length && <p className="text-mute">Todavía no hay pedidos.</p>}
      {orders.map((order) => {
        const number = order.id.slice(0, 8);
        const { name, phone, city, province } = order.customer ?? {};
        const location = [city, province].filter(Boolean).join(", ");
        const whatsapp = phone && customerWhatsApp(phone, `Hola${name ? ` ${name}` : ""}, te escribimos de Visual Graf por tu pedido #${number}.`);
        return (
          <article key={order.id} className="card grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(11rem,1fr)]">
            <div className="min-w-0 space-y-1 break-words">
              <h2 className="font-bold">Pedido #{number}</h2>
              <time className="text-sm text-mute" dateTime={order.created_at}>{formatDate(order.created_at)}</time>
              <p>{name || "Cliente sin nombre"}</p>
              {phone && <p className="text-mute">{phone}</p>}
              {location && <p className="text-mute">{location}</p>}
              {whatsapp && <a href={whatsapp} className="inline-block underline">Escribile por WhatsApp</a>}
            </div>
            <ul className="space-y-2 break-words">
              {order.items.map((item, index) => (
                <li key={index}>
                  <p className="font-semibold">{item.name} · {item.size}</p>
                  <p className="text-sm text-mute">
                    Bolsa {item.bagColor} · Tinta {item.inkColor} · {item.quantity} packs × {item.packSize} unidades
                  </p>
                </li>
              ))}
            </ul>
            <div className="min-w-0 space-y-2">
              <p className="font-bold">{formatARS(order.total)}</p>
              <p className="text-sm text-mute">{paymentLabels[order.payment_method] ?? order.payment_method}</p>
              <ActionForm action={updateOrderStatus.bind(null, order.id)} label="Guardá el estado">
                <label className="block">
                  <span className="label">Estado<span className="sr-only"> del pedido #{number}</span></span>
                  <select name="status" className="field" defaultValue={order.status}>
                    {Object.entries(orderStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </ActionForm>
            </div>
          </article>
        );
      })}
    </section>
  );
}
