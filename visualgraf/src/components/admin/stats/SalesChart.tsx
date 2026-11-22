"use client";
import { useId, useMemo, useState } from "react";
import type { Granularity, SeriesPoint } from "@/lib/stats-types";
import { formatARS } from "@/lib/site";

type Metric = "revenue" | "orders" | "units";
const metrics: { id: Metric; label: string }[] = [
  { id: "revenue", label: "Facturado" },
  { id: "orders", label: "Pedidos" },
  { id: "units", label: "Bolsas" },
];

const nf = new Intl.NumberFormat("es-AR");
function fmt(metric: Metric, v: number) {
  return metric === "revenue" ? formatARS(v) : nf.format(v);
}
function compact(metric: Metric, v: number) {
  if (v >= 1_000_000) return `${metric === "revenue" ? "$ " : ""}${nf.format(Math.round(v / 100_000) / 10)} M`;
  if (v >= 1_000) return `${metric === "revenue" ? "$ " : ""}${nf.format(Math.round(v / 100) / 10)} k`;
  return metric === "revenue" ? `$ ${nf.format(v)}` : nf.format(v);
}

/** Escala "linda": máximo redondeado y 4 líneas de grilla. */
function niceMax(v: number) {
  if (v <= 0) return 4;
  const raw = v / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * pow >= raw) ?? 10;
  // cantidades enteras (pedidos, bolsas): paso mínimo 1
  return Math.max(step * pow, raw < 1 ? 1 : 0) * 4;
}

/** Ventas por día o por mes: columnas de un solo color, un solo eje, tooltip al pasar o enfocar. */
export function SalesChart({ series, granularity }: { series: SeriesPoint[]; granularity: Granularity }) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  const W = 720, H = 260, padL = 64, padR = 12, padT = 16, padB = 30;
  const max = useMemo(() => niceMax(Math.max(0, ...series.map((p) => p[metric]))), [series, metric]);
  const n = Math.max(series.length, 1);
  const slot = (W - padL - padR) / n;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const labelEvery = Math.ceil(n / (granularity === "day" ? 8 : 12));
  const total = series.reduce((s, p) => s + p[metric], 0);
  const best = series.reduce<SeriesPoint | null>((b, p) => (p[metric] > (b?.[metric] ?? 0) ? p : b), null);
  const point = active != null ? series[active] : null;

  return (
    <figure className="card p-4 sm:p-6" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="font-display text-lg font-bold">
            {granularity === "day" ? "Ventas por día" : "Ventas por mes"}
          </h2>
          <p className="text-sm text-mute">
            Total {fmt(metric, total)}
            {best && best[metric] > 0 && <> · mejor {granularity === "day" ? "día" : "mes"}: {best.label} ({fmt(metric, best[metric])})</>}
          </p>
        </div>
        <div role="group" aria-label="Qué medir" className="flex rounded-full border border-line p-1">
          {metrics.map((m) => (
            <button key={m.id} type="button" onClick={() => setMetric(m.id)} aria-pressed={metric === m.id}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${metric === m.id ? "bg-white/15 text-white" : "text-mute hover:text-white"}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"><div className="relative min-w-[36rem] rounded-xl" tabIndex={0} role="group"
          aria-label={`${metrics.find((m) => m.id === metric)!.label} ${granularity === "day" ? "por día" : "por mes"}. Usá las flechas para recorrer; el detalle completo está en la tabla.`}
          onKeyDown={(e) => {
            if (!series.length) return;
            const last = series.length - 1;
            const next = e.key === "ArrowRight" ? Math.min(last, (active ?? -1) + 1)
              : e.key === "ArrowLeft" ? Math.max(0, (active ?? series.length) - 1)
              : e.key === "Home" ? 0 : e.key === "End" ? last : null;
            if (next == null) return;
            e.preventDefault();
            setActive(next);
          }}
          onBlur={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true"
          onMouseLeave={() => setActive(null)}>
          {[0, 1, 2, 3, 4].map((i) => {
            const v = (max / 4) * i;
            return (
              <g key={i}>
                <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="rgb(255 255 255 / 0.08)" strokeWidth={1} />
                <text x={padL - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="#a6a6c0">{compact(metric, v)}</text>
              </g>
            );
          })}
          {series.map((p, i) => {
            const x = padL + slot * i + (slot - barW) / 2;
            const top = y(p[metric]);
            const h = H - padB - top;
            const r = Math.min(4, barW / 2, h);
            const on = active === i;
            return (
              <g key={p.key}>
                {h > 0 && (
                  <path
                    d={`M${x},${H - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${H - padB} Z`}
                    fill={on || active == null ? "#34d3f3" : "rgb(52 211 243 / 0.62)"}
                    stroke={on ? "#ffffff" : "none"} strokeWidth={on ? 1.5 : 0}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={padL + slot * i + slot / 2} y={H - padB + 18} textAnchor="middle" fontSize={11} fill="#a6a6c0">{p.label}</text>
                )}
                {/* área de toque más grande que la barra */}
                <rect x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} fill="transparent"
                  onMouseEnter={() => setActive(i)} onPointerDown={() => setActive(i)} />
              </g>
            );
          })}
          <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="rgb(255 255 255 / 0.25)" strokeWidth={1} />
        </svg>
        {point && active != null && (
          <div aria-hidden="true" className="pointer-events-none absolute top-0 z-10 w-max max-w-[14rem] -translate-x-1/2 rounded-xl border border-line bg-ink-3/95 px-3 py-2 text-sm shadow-xl"
            style={{ left: `clamp(4.5rem, ${((padL + slot * active + slot / 2) / W) * 100}%, calc(100% - 4.5rem))` }}>
            <p className="font-bold">{point.label}</p>
            <p>{formatARS(point.revenue)}</p>
            <p className="text-mute">{nf.format(point.orders)} pedidos · {nf.format(point.units)} bolsas</p>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {point ? `${point.label}: ${formatARS(point.revenue)}, ${nf.format(point.orders)} pedidos, ${nf.format(point.units)} bolsas` : ""}
        </p>
      </div></div>
      <p className="mt-2 text-xs text-mute sm:hidden">Deslizá el gráfico de costado y tocá una barra para ver el detalle.</p>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-mute hover:text-white">Ver como tabla</summary>
        <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-ink-3">
              <tr><th className="p-2">{granularity === "day" ? "Día" : "Mes"}</th><th className="p-2 text-right">Facturado</th><th className="p-2 text-right">Pedidos</th><th className="p-2 text-right">Bolsas</th></tr>
            </thead>
            <tbody>
              {series.map((p) => (
                <tr key={p.key} className="border-t border-line">
                  <td className="p-2">{p.label}</td><td className="p-2 text-right">{formatARS(p.revenue)}</td>
                  <td className="p-2 text-right">{nf.format(p.orders)}</td><td className="p-2 text-right">{nf.format(p.units)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
