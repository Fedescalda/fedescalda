import { ORDER_STATUSES, statusLabel } from "./order-status";
import { SOLD_STATUSES, type Granularity, type Kpi, type RankRow, type SeriesPoint, type Stats, type StatsOrder, type StatsRange } from "./stats-types";

const DAY = 86_400_000;
const ART_OFFSET = 3 * 3_600_000;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const soldStatuses = new Set<string>(SOLD_STATUSES);

function artDate(date: Date) {
  return new Date(date.getTime() - ART_OFFSET);
}

export function artDateKey(date: Date) {
  return seriesKey(artDate(date), "day");
}

function artMidnight(date: Date) {
  return new Date(Math.floor(artDate(date).getTime() / DAY) * DAY + ART_OFFSET);
}

function parseDate(value?: string) {
  // Desde 2010: Argentina está fija en UTC−3 (sin horario de verano), así que el corrimiento fijo es exacto.
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "2010-01-01") return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function shortDate(date: Date) {
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}

export function rangeFromParams(params: { p?: string; desde?: string; hasta?: string }, now = new Date()): StatsRange {
  const today = artMidnight(now);
  if (params.p === "hoy") return { from: today, to: now, label: "Hoy" };

  if (params.p === "custom") {
    const start = parseDate(params.desde);
    const end = parseDate(params.hasta);
    if (start && end && start <= end) {
      const limit = new Date(start);
      limit.setUTCFullYear(start.getUTCFullYear() + 3);
      const exclusiveEnd = end.getTime() + DAY;
      if (exclusiveEnd <= limit.getTime()) {
        return {
          from: new Date(start.getTime() + ART_OFFSET),
          to: new Date(exclusiveEnd + ART_OFFSET),
          label: `${shortDate(start)} – ${shortDate(end)}`,
        };
      }
    }
  }

  if (params.p === "anio" || params.p === "12m") {
    const start = artDate(today);
    start.setUTCDate(1);
    start.setUTCMonth(params.p === "anio" ? 0 : start.getUTCMonth() - 11);
    return {
      from: new Date(start.getTime() + ART_OFFSET),
      to: now,
      label: params.p === "anio" ? "Este año" : "Últimos 12 meses",
    };
  }

  const days = params.p === "7d" ? 7 : params.p === "90d" ? 90 : 30;
  return { from: new Date(today.getTime() - (days - 1) * DAY), to: now, label: `Últimos ${days} días` };
}

/** true si se pidió un rango personalizado y no es válido (se muestra el período por defecto). */
export function isInvalidCustomRange(params: { p?: string; desde?: string; hasta?: string }) {
  if (params.p !== "custom") return false;
  const start = parseDate(params.desde);
  const end = parseDate(params.hasta);
  if (!start || !end || start > end) return true;
  const limit = new Date(start);
  limit.setUTCFullYear(start.getUTCFullYear() + 3);
  return end.getTime() + DAY > limit.getTime();
}

/** Cuánto antes del rango hay que leer pedidos: un pedido creado antes puede pagarse dentro del rango. */
export const SALE_LOOKBACK_MS = 120 * DAY;

/** Fecha de la venta: primera vez que el pedido pasó a un estado vendido (si no hay historial, la creación). */
export function saleDate(order: StatsOrder) {
  const hit = (order.history ?? []).find((h) => soldStatuses.has(h.status) && h.at);
  const date = hit ? new Date(hit.at) : new Date(order.created_at);
  return Number.isFinite(date.getTime()) ? date : new Date(order.created_at);
}

export function previousRange(range: StatsRange): StatsRange {
  return {
    from: new Date(2 * range.from.getTime() - range.to.getTime()),
    to: range.from,
    label: "Período anterior",
  };
}

export function granularityFor(range: StatsRange): Granularity {
  return range.to.getTime() - range.from.getTime() <= 92 * DAY ? "day" : "month";
}

function seriesKey(date: Date, granularity: Granularity) {
  return date.toISOString().slice(0, granularity === "day" ? 10 : 7);
}

function emptySeries(range: StatsRange, granularity: Granularity) {
  const points = new Map<string, SeriesPoint>();
  const cursor = artDate(artMidnight(range.from));
  if (granularity === "month") cursor.setUTCDate(1);
  const end = artDate(range.to);

  while (range.from < range.to && cursor < end) {
    const key = seriesKey(cursor, granularity);
    const label = granularity === "day"
      ? `${key.slice(8, 10)}/${key.slice(5, 7)}`
      : `${MONTHS[cursor.getUTCMonth()]} ${key.slice(2, 4)}`;
    points.set(key, { key, label, revenue: 0, orders: 0, units: 0 });
    if (granularity === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return points;
}

type Rank = Map<string, { revenue: number; units: number; orderIds: Set<string> }>;

function addRank(rank: Rank, label: string, revenue: number, units: number, orderId: string) {
  const row = rank.get(label) ?? { revenue: 0, units: 0, orderIds: new Set<string>() };
  row.revenue += revenue;
  row.units += units;
  row.orderIds.add(orderId);
  rank.set(label, row);
}

function rankRows(rank: Rank, by: "revenue" | "units"): RankRow[] {
  const total = [...rank.values()].reduce((sum, row) => sum + row[by], 0);
  const entries = [...rank.entries()].sort((a, b) => b[1][by] - a[1][by]);
  if (entries.length > 8) {
    const others = entries.splice(7);
    const combined = { revenue: 0, units: 0, orderIds: new Set<string>() };
    for (const [, row] of others) {
      combined.revenue += row.revenue;
      combined.units += row.units;
      for (const id of row.orderIds) combined.orderIds.add(id);
    }
    entries.push(["Otros", combined]);
  }
  return entries.map(([label, row]) => ({
    label, revenue: row.revenue, units: row.units, orders: row.orderIds.size,
    share: total ? row[by] / total : 0,
  }));
}

const paymentLabels = new Map([
  ["mercadopago", "Mercado Pago"], ["transferencia", "Transferencia"], ["whatsapp", "WhatsApp"],
]);

function summarize(orders: StatsOrder[], range: StatsRange, onSale?: (order: StatsOrder, date: Date, units: number) => void) {
  let revenue = 0;
  let sold = 0;
  let units = 0;
  let pendingOrders = 0;
  let pendingAmount = 0;
  const counts = new Map<string, number>();

  for (const order of orders) {
    const created = new Date(order.created_at);
    if (created >= range.from && created < range.to) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
      if (order.status === "pendiente") {
        pendingOrders++;
        pendingAmount += order.total;
      }
    }
    if (!soldStatuses.has(order.status)) continue;
    const date = saleDate(order);
    if (!(date >= range.from && date < range.to)) continue;
    const orderUnits = (order.items ?? []).reduce((sum, item) => sum + item.quantity * item.packSize, 0);
    revenue += order.total;
    sold++;
    units += orderUnits;
    onSale?.(order, date, orderUnits);
  }

  return { revenue, orders: sold, avgTicket: sold ? revenue / sold : 0, units, pendingOrders, pendingAmount, counts };
}

function kpi(value: number, previous: number): Kpi {
  const changePct = previous ? Number((((value - previous) / previous) * 100).toFixed(1)) : null;
  return { value, previous, changePct: changePct === 0 ? 0 : changePct };
}

export function computeStats(orders: StatsOrder[], range: StatsRange, prevOrders: StatsOrder[]): Stats {
  const granularity = granularityFor(range);
  const series = emptySeries(range, granularity);
  const bySize: Rank = new Map();
  const byBagColor: Rank = new Map();
  const byInk: Rank = new Map();
  const byProvince: Rank = new Map();
  const byPayment: Rank = new Map();

  const current = summarize(orders, range, (order, date, units) => {
    const point = series.get(seriesKey(artDate(date), granularity));
    if (point) {
      point.revenue += order.total;
      point.orders++;
      point.units += units;
    }

    for (const item of order.items ?? []) {
      const revenue = item.quantity * item.unitPrice;
      const itemUnits = item.quantity * item.packSize;
      addRank(bySize, item.size, revenue, itemUnits, order.id);
      addRank(byBagColor, item.bagColor, revenue, itemUnits, order.id);
      addRank(byInk, item.inkColor, revenue, itemUnits, order.id);
    }
    addRank(byProvince, order.customer?.province?.trim() || "Sin dato", order.total, units, order.id);
    addRank(byPayment, paymentLabels.get(order.payment_method) ?? (order.payment_method || "Sin dato"), order.total, units, order.id);
  });

  const previous = summarize(prevOrders, previousRange(range));
  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString(), label: range.label },
    granularity,
    kpis: {
      revenue: kpi(current.revenue, previous.revenue),
      orders: kpi(current.orders, previous.orders),
      avgTicket: kpi(current.avgTicket, previous.avgTicket),
      units: kpi(current.units, previous.units),
      pendingOrders: kpi(current.pendingOrders, previous.pendingOrders),
      pendingAmount: kpi(current.pendingAmount, previous.pendingAmount),
    },
    series: [...series.values()],
    bySize: rankRows(bySize, "units"),
    byBagColor: rankRows(byBagColor, "units"),
    byInk: rankRows(byInk, "units"),
    byProvince: rankRows(byProvince, "revenue"),
    byPayment: rankRows(byPayment, "revenue"),
    funnel: ORDER_STATUSES.map((status) => ({ status, label: statusLabel[status], count: current.counts.get(status) ?? 0 })),
  };
}

type CsvCell = string | number | null;

function csvCell(value: CsvCell) {
  if (value === null) return "";
  if (typeof value === "number") return value.toString().replace(".", ",");
  // Evita que una etiqueta ingresada por un usuario se ejecute como fórmula.
  const safe = /^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function statsToCsv(stats: Stats): string {
  const { kpis } = stats;
  const metrics = [
    ["Facturado", kpis.revenue], ["Pedidos vendidos", kpis.orders], ["Ticket promedio", kpis.avgTicket],
    ["Bolsas vendidas", kpis.units], ["Pedidos pendientes", kpis.pendingOrders], ["Monto pendiente", kpis.pendingAmount],
  ] as const;
  const rows: CsvCell[][] = [
    ["Resumen"],
    ["Período", stats.range.label],
    ["Indicador", "Actual", "Anterior", "Variación (%)"],
    ...metrics.map(([label, metric]) => [label, metric.value, metric.previous, metric.changePct]),
    [],
    ["Serie"],
    ["Fecha", "Facturado", "Pedidos", "Bolsas"],
    ...stats.series.map((point) => [point.key, point.revenue, point.orders, point.units]),
  ];
  const rankings = [
    ["Por medida", stats.bySize], ["Por color de bolsa", stats.byBagColor], ["Por impresión", stats.byInk],
    ["Por provincia", stats.byProvince], ["Por medio de pago", stats.byPayment],
  ] as const;
  for (const [label, ranking] of rankings) {
    rows.push([], [label], ["Detalle", "Facturado", "Pedidos", "Bolsas", ranking === stats.byProvince || ranking === stats.byPayment ? "Participación en facturado (%)" : "Participación en bolsas (%)"]);
    for (const row of ranking) rows.push([row.label, row.revenue, row.orders, row.units, Math.round(row.share * 10_000) / 100]);
  }
  return rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}
