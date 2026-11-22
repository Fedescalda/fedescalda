import { artDateKey, computeStats, isInvalidCustomRange, previousRange, rangeFromParams, statsToCsv } from "@/lib/stats";
import { getAdminClient } from "../session";
import { loadStatsOrders as loadOrders } from "../stats-load";

export async function GET(request: Request) {
  const client = await getAdminClient();
  if (!client) return new Response("No autorizado", { status: 401 });

  const params = new URL(request.url).searchParams;
  const query = {
    p: params.get("p") ?? undefined,
    desde: params.get("desde") ?? undefined,
    hasta: params.get("hasta") ?? undefined,
  };
  if (isInvalidCustomRange(query)) return new Response("Rango de fechas inválido", { status: 400 });
  const range = rangeFromParams(query);

  try {
    const [orders, prevOrders] = await Promise.all([
      loadOrders(client, range),
      loadOrders(client, previousRange(range)),
    ]);
    const lastDay = new Date(Math.max(range.from.getTime(), range.to.getTime() - 1));
    const filename = `estadisticas-visualgraf-${artDateKey(range.from)}-${artDateKey(lastDay)}.csv`;
    return new Response(`\uFEFF${statsToCsv(computeStats(orders, range, prevOrders))}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("No se pudieron exportar las estadísticas", { status: 500 });
  }
}
