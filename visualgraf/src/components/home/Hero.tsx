import Image from "next/image";
import Link from "next/link";
import { waLink } from "@/lib/site";
import { IconArrow, IconWhatsApp } from "../Icons";

const stack = [
  { src: "/img/clientes/olivia.webp", alt: "Bolsa blanca impresa en rosa para Olivia Kids", cls: "left-[1%] top-[10%] w-[42%] [--r:-8deg]", delay: "0s" },
  { src: "/img/ecommerce-rosa.webp", alt: "Bolsa rosa para ecommerce con el logo de Visual Graf", cls: "right-[1%] top-[2%] w-[40%] [--r:7deg]", delay: "1.2s" },
  { src: "/img/clientes/perfumate.webp", alt: "Bolsa negra con impresión dorada para Perfúmate MG", cls: "left-[29%] top-[30%] w-[42%] [--r:-1deg] z-10", delay: "0.6s" },
];

export function Hero() {
  return (
    <section className="noise relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="glow -top-32 -left-24 h-96 w-96 bg-brand-blue" aria-hidden />
      <div className="glow top-40 -right-24 h-[28rem] w-[28rem] bg-brand-magenta opacity-40" aria-hidden />
      <div className="glow -bottom-40 left-1/3 h-80 w-80 bg-brand-orange opacity-25" aria-hidden />

      <div className="container-vg grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="ring-rainbow mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide md:text-sm">
            <span className="h-2 w-2 rounded-full bg-brand-green" aria-hidden /> Envíos a toda la Argentina
          </p>
          <h1 className="font-display text-[2.7rem] leading-[0.98] font-black tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Tu marca, <br />
            <span className="text-gradient">en cada bolsa.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-white/75 md:text-xl">
            Bolsas personalizadas para comercios y emprendimientos. Elegí tu medida y color, probá tu logo online, comprá y recibilas en cualquier punto del país.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/personalizar" className="btn btn-primary">
              Probá tu logo gratis <IconArrow />
            </Link>
            <a href={waLink("¡Hola Visual Graf! Quiero pedir un presupuesto de bolsas con mi logo.")} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <IconWhatsApp /> Pedí tu presupuesto
            </a>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
            {[
              ["5", "medidas"],
              ["4", "colores de bolsa"],
              ["100", "unidades por pack"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl font-black">{n}</dd>
                <dd className="text-xs text-mute">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
          <div className="absolute inset-[8%] animate-spin-slow rounded-full opacity-70 motion-reduce:animate-none" style={{ background: "conic-gradient(from 0deg,#3a64ff,#9b33f5,#ff2e93,#ff7a1c,#ffc61f,#39c16a,#34d3f3,#3a64ff)", mask: "radial-gradient(circle, transparent 62%, #000 63%, #000 70%, transparent 71%)", WebkitMask: "radial-gradient(circle, transparent 62%, #000 63%, #000 70%, transparent 71%)" }} aria-hidden />
          {stack.map((s) => (
            <div key={s.src} className={`absolute animate-float overflow-hidden rounded-3xl border border-white/15 shadow-2xl shadow-black/60 ${s.cls}`} style={{ animationDelay: s.delay, transform: "rotate(var(--r))" }}>
              <Image src={s.src} alt={s.alt} width={420} height={520} priority sizes="(min-width:1024px) 240px, 45vw" className="h-auto w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
