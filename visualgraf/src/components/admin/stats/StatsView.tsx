import Link from "next/link";
import { SalesChart } from "./SalesChart";
import type { Kpi, RankRow, Stats } from "@/lib/stats-types";
import { formatARS } from "@/lib/site";

const nf = new Intl.NumberFormat("es-AR");

/** Tablero de estadísticas (sin fetch: recibe los datos ya calculados). */
export function StatsView({ stats }: { stats: Stats }) {
  return (
    <>
          <p className="text-sm text-mute">
            Se cuentan como venta los pedidos pagados o más avanzados (en diseño, en producción, enviados y entregados), en la fecha en que se acreditó el pago.
            Los pendientes de pago y cancelados no suman.
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
            <Tile label="Facturado" kpi={stats.kpis.revenue} money />
            <Tile label="Pedidos vendidos" kpi={stats.kpis.orders} />
            <Tile label="Ticket promedio" kpi={stats.kpis.avgTicket} money />
            <Tile label="Bolsas vendidas" kpi={stats.kpis.units} />
            <Tile label="Pendientes de pago" kpi={stats.kpis.pendingOrders} sub={`${formatARS(stats.kpis.pendingAmount.value)} por cobrar`} neutral />
          </div>

          <SalesChart series={stats.series} granularity={stats.granularity} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Ranking title="Medidas más vendidas" rows={stats.bySize} unitsFirst />
            <Ranking title="Color de bolsa" rows={stats.byBagColor} unitsFirst />
            <Ranking title="Color de impresión" rows={stats.byInk} unitsFirst />
            <Ranking title="Provincias" rows={stats.byProvince} />
            <Ranking title="Medio de pago" rows={stats.byPayment} />
            <Funnel rows={stats.funnel} />
          </div>
    </>
  );
}

function Tile({ label, kpi, money, sub, neutral }: { label: string; kpi: Kpi; money?: boolean; sub?: string; neutral?: boolean }) {
  const value = money ? formatARS(Math.round(kpi.value)) : nf.format(Math.round(kpi.value));
  const prev = money ? formatARS(Math.round(kpi.previous)) : nf.format(Math.round(kpi.previous));
  const ch = kpi.changePct;
  const up = ch != null && ch > 0;
  const down = ch != null && ch < 0;
  // en "pendientes" subir no es bueno ni malo: sin color
  const tone = neutral || ch == null || ch === 0 ? "text-mute" : up ? "text-brand-green" : "text-red-300";
  return (
    <div className="card p-4">
      <p className="text-sm text-mute">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold tabular-nums sm:text-2xl">{value}</p>
      <p className={`mt-1 text-xs font-semibold tabular-nums ${tone}`}>
        {ch == null ? "Sin datos del período anterior" : (
          <>
            <span aria-hidden="true">{up ? "▲" : down ? "▼" : "="} </span>
            {up ? "+" : ""}{nf.format(ch)}% <span className="sr-only">{up ? "más" : down ? "menos" : "igual"}</span>
            <span className="font-normal text-mute"> vs. {prev}</span>
          </>
        )}
      </p>
      {sub && <p className="mt-1 text-xs text-mute">{sub}</p>}
    </div>
  );
}

function Ranking({ title, rows, unitsFirst }: { title: string; rows: RankRow[]; unitsFirst?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => (unitsFirst ? r.units : r.revenue)));
  return (
    <section className="card p-4 sm:p-5" aria-label={title}>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {!rows.length ? <p className="mt-2 text-sm text-mute">Sin ventas en este período.</p> : (
        <ol className="mt-3 space-y-3">
          {rows.map((r) => {
            const v = unitsFirst ? r.units : r.revenue;
            return (
              <li key={r.label} title={`${r.label}: ${formatARS(r.revenue)} · ${nf.format(r.orders)} pedidos · ${nf.format(r.units)} bolsas`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{r.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {unitsFirst ? `${nf.format(r.units)} bolsas` : formatARS(r.revenue)}
                    <span className="text-mute"> · {nf.format(Math.round(r.share * 100))}%</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/5" aria-hidden="true">
                  <div className="h-2 rounded-full bg-brand-cyan" style={{ width: `${Math.max(1.5, (v / max) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Funnel({ rows }: { rows: Stats["funnel"] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card p-4 sm:p-5" aria-label="Pedidos por estado">
      <h2 className="font-display text-lg font-bold">Pedidos ingresados por estado</h2>
      <p className="text-xs text-mute">Pedidos creados en el período, según su estado actual.</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.status}>
            <Link href={`/admin?estado=${r.status}`} className="block rounded-lg hover:bg-white/5">
              <div className="flex justify-between text-sm"><span>{r.label}</span><span className="tabular-nums">{nf.format(r.count)}</span></div>
              <div className="mt-1 h-2 rounded-full bg-white/5" aria-hidden="true">
                <div className={`h-2 rounded-full ${r.status === "cancelado" ? "bg-white/30" : "bg-brand-cyan/70"}`} style={{ width: `${r.count ? Math.max(1.5, (r.count / max) * 100) : 0}%` }} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
