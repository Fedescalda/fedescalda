export function PageHeader({ eyebrow, title, highlight, text, children }: { eyebrow: string; title: string; highlight?: string; text?: string; children?: React.ReactNode }) {
  return (
    <section className="noise relative isolate overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
      <div className="glow -top-24 -left-24 h-80 w-80 bg-brand-blue opacity-45" aria-hidden />
      <div className="glow -top-10 right-0 h-72 w-72 bg-brand-magenta opacity-30" aria-hidden />
      <div className="container-vg relative">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="max-w-4xl font-display text-[2.4rem] leading-[1.02] font-black tracking-tight text-balance md:text-6xl">
          {title} {highlight && <span className="text-gradient">{highlight}</span>}
        </h1>
        <div className="rainbow-line mt-6" />
        {text && <p className="mt-6 max-w-2xl text-lg text-pretty text-white/75">{text}</p>}
        {children}
      </div>
    </section>
  );
}
