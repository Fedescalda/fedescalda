// Contrato de datos de Estadísticas (compartido por el cálculo y la UI).

/** Un pedido es "venta" si el pago está acreditado o el pedido avanzó después del pago. */
export const SOLD_STATUSES = ["pagado", "diseno", "en_produccion", "enviado", "entregado"] as const;

export type StatsOrder = {
  id: string;
  created_at: string; // ISO
  status: string;
  total: number;
  shipping: number;
  discount: number;
  payment_method: string;
  customer: { province?: string | null } | null;
  /** Historial de estados: se usa para fechar la venta el día que se acreditó el pago. */
  history?: { status: string; at: string }[] | null;
  items: { name: string; size: string; bagColor: string; inkColor: string; quantity: number; packSize: number; unitPrice: number }[];
};

export type StatsRange = { from: Date; to: Date; label: string };
export type Granularity = "day" | "month";

export type Kpi = { value: number; previous: number; changePct: number | null };

export type SeriesPoint = { key: string; label: string; revenue: number; orders: number; units: number };

export type RankRow = { label: string; revenue: number; orders: number; units: number; share: number };

export type Stats = {
  range: { from: string; to: string; label: string };
  granularity: Granularity;
  kpis: {
    revenue: Kpi; // facturado (ventas)
    orders: Kpi; // pedidos vendidos
    avgTicket: Kpi; // facturado / pedidos
    units: Kpi; // bolsas vendidas (packs × unidades por pack)
    pendingOrders: Kpi; // pedidos creados aún sin pagar
    pendingAmount: Kpi; // monto de esos pedidos
  };
  series: SeriesPoint[]; // todos los días/meses del rango, incluidos los vacíos (0)
  bySize: RankRow[];
  byBagColor: RankRow[];
  byInk: RankRow[];
  byProvince: RankRow[];
  byPayment: RankRow[];
  funnel: { status: string; label: string; count: number }[]; // todos los pedidos del rango por estado
};
