import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SALE_LOOKBACK_MS } from "@/lib/stats";
import type { StatsOrder, StatsRange } from "@/lib/stats-types";

/**
 * Trae los pedidos que pueden contar en el rango (paginado de a 1000, por id). Incluye pedidos creados
 * hasta 120 días antes, porque la venta se fecha cuando se acredita el pago (ver saleDate en lib/stats).
 */
export async function loadStatsOrders(client: SupabaseClient, range: StatsRange) {
  const orders: StatsOrder[] = [];
  let lastId: string | undefined;

  for (;;) {
    let query = client.from("orders")
      .select("id,created_at,status,total,shipping,discount,payment_method,customer,items,history")
      .gte("created_at", new Date(range.from.getTime() - SALE_LOOKBACK_MS).toISOString())
      .lt("created_at", range.to.toISOString())
      .order("id")
      .limit(1000);
    if (lastId) query = query.gt("id", lastId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data.length) return orders;
    orders.push(...(data as StatsOrder[]));
    lastId = data[data.length - 1].id;
  }
}
