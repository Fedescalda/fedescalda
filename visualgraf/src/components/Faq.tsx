import { faqs } from "@/lib/content";

export function Faq({ items = faqs }: { items?: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white/[0.03]">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-display text-base font-bold md:px-7 md:text-lg [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line transition group-open:rotate-45 group-open:bg-white group-open:text-ink" aria-hidden>
              +
            </span>
          </summary>
          <p className="px-5 pb-6 text-white/75 md:px-7">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
