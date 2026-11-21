import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { IconArrow } from "@/components/Icons";
import { story } from "@/lib/content";
import { waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nuestra historia",
  description: "Visual Graf nació como un sueño a los 19 años. Años de impresión flexográfica y venta de polietileno después, hoy imprimimos bolsas para comercios y emprendimientos de toda la Argentina.",
  alternates: { canonical: "/nuestra-historia" },
};

export default function HistoriaPage() {
  return (
    <>
      <section className="noise relative isolate overflow-hidden pt-32 pb-16 md:pt-44 md:pb-24">
        <div className="glow -top-24 left-1/4 h-96 w-96 bg-brand-violet opacity-40" aria-hidden />
        <div className="glow top-20 -right-20 h-80 w-80 bg-brand-orange opacity-25" aria-hidden />
        <div className="container-vg relative grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow mb-4">{story.kicker}</p>
            <h1 className="font-display text-[2.4rem] leading-[1.02] font-black tracking-tight text-balance md:text-6xl">
              Hay sueños que no desaparecen. <span className="text-gradient">Solo esperan su momento.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/80">{story.intro}</p>
          </div>
          <figure className="card relative p-7 md:p-10">
            <span className="text-gradient font-display text-7xl leading-none font-black" aria-hidden>“</span>
            <blockquote className="-mt-4 font-display text-xl leading-snug font-bold md:text-2xl">{story.quote}</blockquote>
            <figcaption className="mt-5 text-sm text-mute">Fundador de Visual Graf</figcaption>
          </figure>
        </div>
      </section>

      {/* Línea de tiempo */}
      <section className="container-vg" aria-label="Nuestro recorrido">
        <ol className="relative space-y-14 md:space-y-24">
          <span className="absolute top-2 bottom-2 left-4 w-px md:left-1/2" style={{ background: "linear-gradient(#34d3f3,#9b33f5,#ff2e93,#ff7a1c,#ffc61f)" }} aria-hidden />
          {story.milestones.map((m, i) => (
            <li key={m.title} className="relative grid gap-6 pl-12 md:grid-cols-2 md:gap-16 md:pl-0">
              <span className="absolute top-1.5 left-4 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-ink md:left-1/2" style={{ background: ["#34d3f3", "#9b33f5", "#ff2e93", "#ff7a1c", "#ffc61f"][i % 5] }} aria-hidden />
              <Reveal className={i % 2 ? "md:order-2" : "md:text-right"}>
                <p className="eyebrow mb-3 !text-brand-cyan">{m.tag}</p>
                <h2 className="font-display text-2xl leading-tight font-black md:text-3xl">{m.title}</h2>
                <p className="mt-4 text-white/80">{m.text}</p>
              </Reveal>
              <Reveal delay={120} className={i % 2 ? "md:order-1" : ""}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line">
                  <Image src={m.image} alt={m.alt} fill sizes="(min-width:768px) 40vw, 90vw" className="object-cover" />
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Experiencia */}
      <section className="container-vg mt-24 md:mt-32" aria-labelledby="experiencia">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">Mi experiencia</p>
          <h2 id="experiencia" className="font-display text-3xl font-black md:text-5xl">
            Antes de crear Visual Graf, <span className="text-gradient">aprendí el producto.</span>
          </h2>
        </Reveal>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {story.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80} className="card p-6">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-gradient font-display text-5xl font-black md:text-6xl">{s.n}</dd>
              <dd className="mt-2 text-sm text-white/75">{s.label}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Cierre */}
      <section className="container-vg mt-24 md:mt-32">
        <Reveal>
          <div className="noise relative isolate overflow-hidden rounded-[2rem] border border-line p-8 md:p-16" style={{ background: "linear-gradient(135deg,#141a4a 0%,#2a0e45 55%,#3d0c2b 100%)" }}>
            <p className="eyebrow mb-4">Por qué hago esto</p>
            <p className="max-w-3xl text-lg text-white/85 md:text-xl">{story.closing}</p>
            <blockquote className="mt-8 max-w-3xl font-display text-2xl leading-snug font-black md:text-4xl">
              “{story.closingQuote}”
            </blockquote>
            <p className="mt-8 text-white/85">Ahora quiero que Visual Graf también sea parte de tu marca. Contame qué tipo de bolsa necesitás y vemos juntos la mejor opción para tu negocio.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={waLink("¡Hola! Leí su historia y quiero cotizar mis bolsas.")} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                Quiero cotizar mis bolsas
              </a>
              <Link href="/productos" className="btn btn-ghost">
                Ver productos <IconArrow />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
