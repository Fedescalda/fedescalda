import { rubros } from "@/lib/content";

export function Marquee() {
  const list = [...rubros, ...rubros];
  return (
    <div className="relative overflow-hidden border-y border-line bg-ink-2 py-5" aria-label="Rubros con los que trabajamos">
      <ul className="flex w-max animate-marquee gap-10 whitespace-nowrap motion-reduce:animate-none">
        {list.map((r, i) => (
          <li key={i} aria-hidden={i >= rubros.length} className="flex items-center gap-10 font-display text-lg font-extrabold tracking-tight text-white/80 md:text-2xl">
            {r}
            <span className="h-2 w-2 rounded-full" style={{ background: ["#34d3f3", "#9b33f5", "#ff2e93", "#ff7a1c", "#ffc61f"][i % 5] }} />
          </li>
        ))}
      </ul>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink-2" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink-2" aria-hidden />
    </div>
  );
}
