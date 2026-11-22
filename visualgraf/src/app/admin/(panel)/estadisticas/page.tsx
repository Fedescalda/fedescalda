import Link from "next/link";
import type { Metadata } from "next";
import { StatsView } from "@/components/admin/stats/StatsView";
import { computeStats, isInvalidCustomRange, previousRange, rangeFromParams } from "@/lib/stats";
import type { Stats } from "@/lib/stats-types";
import { getPanelClient } from "../../session";
import { loadStatsOrders } from "../../stats-load";

export const metadata: Metadata = { title: "Estadísticas", robots: { index: false } };

const presets = [
  { p: "hoy", label: "Hoy" },
  { p: "7d", label: "7 días" },
  { p: "30d", label: "30 días" },
  { p: "90d", label: "90 días" },
  { p: "12m", label: "12 meses" },
  { p: "anio", label: "Este año" },
];

const day = new Intl.DateTimeFormat("fr-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" });

type Params = { p?: string | string[]; desde?: string | string[]; hasta?: string | string[] };
const one = (v?: string | string[]) => (typeof v === "string" ? v : undefined);

export default async function StatsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const sp = await searchParams;
  const params = { p: one(sp.p), desde: one(sp.desde), hasta: one(sp.hasta) };
  const range = rangeFromParams(params);
  const invalid = isInvalidCustomRange(params);
  const current = params.p === "custom" && !invalid ? "custom" : (presets.some((x) => x.p === params.p) ? params.p : "30d");

  let stats: Stats | null = null;
  try {
    const [orders, prev] = await Promise.all([
      loadStatsOrders(supabase, range),
      loadStatsOrders(supabase, previousRange(range)),
    ]);
    stats = computeStats(orders, range, prev);
  } catch {
    stats = null;
  }

  const lastDay = new Date(Math.max(range.from.getTime(), range.to.getTime() - 1));
  const desde = day.format(range.from);
  const hasta = day.format(lastDay);
  // el CSV usa las mismas fechas que se ven en pantalla (aunque se descargue después de medianoche)
  const exportQs = new URLSearchParams({ p: "custom", desde, hasta });

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-mute">{range.label} · comparado con el período anterior de igual duración</p>
        </div>
        <a href={`/admin/stats-export?${exportQs}`} className="btn btn-ghost" download>
          Exportar a Excel (CSV)
        </a>
      </div>

      {/* Filtros: una sola fila, presets primero */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <nav aria-label="Período" className="flex flex-wrap gap-2">
          {presets.map((x) => (
            <Link key={x.p} href={`/admin/estadisticas?p=${x.p}`} aria-current={current === x.p ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${current === x.p ? "bg-white text-ink" : "border border-line text-mute hover:text-white"}`}>
              {x.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/estadisticas" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="p" value="custom" />
          <label className="text-sm">
            <span className="mb-1 block text-mute">Desde</span>
            <input type="date" name="desde" defaultValue={invalid ? params.desde : desde} required aria-invalid={invalid || undefined} aria-describedby={invalid ? "rango-error" : undefined} className="field min-h-0 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-mute">Hasta</span>
            <input type="date" name="hasta" defaultValue={invalid ? params.hasta : hasta} required aria-invalid={invalid || undefined} aria-describedby={invalid ? "rango-error" : undefined} className="field min-h-0 py-2" />
          </label>
          <button className={`btn min-h-0 py-2.5 ${current === "custom" ? "btn-primary" : "btn-ghost"}`}>Aplicar</button>
        </form>
      </div>

      {invalid && (
        <p id="rango-error" role="alert" className="card border-brand-yellow/40 p-4 text-brand-yellow">
          Ese rango no es válido: revisá que «Desde» sea anterior a «Hasta», desde 2010 y de hasta 3 años.
          Mientras tanto te mostramos los últimos 30 días.
        </p>
      )}
      {!stats && <p role="alert" className="card p-4">No pudimos cargar las estadísticas. Probá de nuevo en un rato.</p>}

      {stats && <StatsView stats={stats} />}
    </section>
  );
}
