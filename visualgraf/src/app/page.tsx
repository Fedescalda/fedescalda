import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { ComboPicker } from "@/components/home/ComboPicker";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { CtaBand } from "@/components/CtaBand";
import { IconArrow, IconBrush, IconCheck, IconShield, IconSpark, IconTruck, IconUpload } from "@/components/Icons";
import { benefits, steps, works } from "@/lib/content";
import { getProducts } from "@/lib/data";
import { formatARS } from "@/lib/site";

export const revalidate = 300;

const benefitIcons = [IconBrush, IconSpark, IconShield, IconTruck];
const accent = ["#34d3f3", "#9b33f5", "#ff2e93", "#ff7a1c"];

export default async function Home() {
  const all = await getProducts();
  const products = all.filter((p) => p.featured).slice(0, 3);
  const rinon = all.find((p) => p.category === "manija-rinon");

  return (
    <>
      <Hero />
      <Marquee />

      {/* Beneficios */}
      <section className="container-vg mt-20 md:mt-28" aria-labelledby="beneficios">
        <h2 id="beneficios" className="sr-only">Por qué Visual Graf</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => {
            const Icon = benefitIcons[i];
            return (
              <Reveal as="li" key={b.title} delay={i * 80} className="card p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${accent[i]}22`, color: accent[i] }}>
                  <Icon width={24} height={24} />
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-mute">{b.text}</p>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* Combinación */}
      <section className="container-vg mt-24 md:mt-32" aria-labelledby="combinacion">
        <SectionHeading eyebrow="Bolsa + impresión" title="Elegí tu" highlight="combinación" text="La elección correcta refuerza tu identidad. Tocá los colores y mirá cómo queda." />
        <Reveal>
          <ComboPicker />
        </Reveal>
      </section>

      {/* Productos */}
      <section className="container-vg mt-24 md:mt-32" id="precios">
        <SectionHeading eyebrow="Elegí el pack para tu negocio" title="Tus próximas bolsas" highlight="empiezan acá." text="Bolsas manija riñón de alta densidad, impresas 1 cara 1 color. Precio por pack de 100 unidades." />
        {rinon && (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {rinon.variants.map((v, i) => (
              <Reveal as="li" key={v.size} delay={i * 70}>
                <Link href={`/productos/${rinon.slug}?medida=${i}`} className="group card flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-white/25">
                  <div className="relative aspect-square overflow-hidden">
                    <Image src={v.image ?? rinon.images[0].src} alt={`Bolsa manija riñón ${v.size}`} fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="font-display text-lg font-extrabold">{v.size}</p>
                    <p className="text-xs text-mute">x 100 unidades</p>
                    <p className="mt-3 font-display text-xl font-black text-gradient">{v.price != null ? formatARS(v.price) : "Consultar"}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white/80 group-hover:text-white">
                      Elegir <IconArrow width={16} height={16} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.filter((p) => p.id !== rinon?.id).map((p, i) => (
            <Reveal key={p.id} delay={i * 100}>
              <ProductCard product={p} />
            </Reveal>
          ))}
          <Reveal delay={200}>
            <div className="card flex h-full flex-col justify-center p-7">
              <p className="eyebrow mb-3">¿Otra medida?</p>
              <p className="font-display text-2xl leading-tight font-extrabold">¿Otra medida o una cantidad especial? Te ayudamos a elegir.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/productos" className="btn btn-ghost">
                  Ver toda la tienda <IconArrow />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="container-vg mt-24 md:mt-32">
        <SectionHeading eyebrow="Así de simple" title="Cómo" highlight="funciona" />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="card relative overflow-hidden p-6 pt-16">
              <span className="text-gradient absolute top-3 left-6 font-display text-5xl font-black" aria-hidden>
                0{i + 1}
              </span>
              <h3 className="font-display text-lg font-extrabold">{s.title}</h3>
              <p className="mt-2 text-sm text-mute">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Simulador teaser */}
      <section className="container-vg mt-24 md:mt-32">
        <Reveal>
          <div className="card relative grid items-center gap-8 overflow-hidden p-6 md:grid-cols-2 md:p-12">
            <div className="glow -right-20 -bottom-20 h-80 w-80 bg-brand-cyan opacity-30" aria-hidden />
            <div className="relative">
              <p className="eyebrow mb-3">Nuevo · Simulador online</p>
              <h2 className="font-display text-3xl leading-tight font-black md:text-5xl">
                Subí tu logo y <span className="text-gradient">mirá tu bolsa</span> al instante
              </h2>
              <ul className="mt-6 space-y-2.5 text-white/80">
                {["Elegí modelo, color de bolsa y de impresión", "Mové y ajustá el tamaño del logo", "Descargá la imagen y pedí tu presupuesto"].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <IconCheck className="mt-0.5 shrink-0 text-brand-green" /> {t}
                  </li>
                ))}
              </ul>
              <Link href="/personalizar" className="btn btn-primary mt-8">
                <IconUpload /> Subir mi logo
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-line">
              <Image src="/img/tu-logo-aca.webp" alt="Bolsa para hielo con la leyenda Tu logo acá impresa en azul" width={900} height={830} sizes="(min-width:768px) 40vw, 100vw" className="h-auto w-full" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Trabajos */}
      <section className="mt-24 md:mt-32">
        <div className="container-vg">
          <SectionHeading eyebrow="Trabajos reales" title="Marcas que ya" highlight="llevan su bolsa" />
        </div>
        <ul className="container-vg flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:grid md:grid-cols-5 md:overflow-visible">
          {works.map((w, i) => (
            <Reveal as="li" key={w.name} delay={i * 70} className="w-[70%] shrink-0 snap-center sm:w-[42%] md:w-auto">
              <figure className="group overflow-hidden rounded-3xl border border-line bg-ink-3">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image src={w.src} alt={w.alt} fill sizes="(min-width:768px) 20vw, 70vw" className="object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <figcaption className="p-4">
                  <p className="font-display font-bold">{w.name}</p>
                  <p className="text-xs text-mute">{w.detail}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="container-vg mt-24 md:mt-32">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Lo que todos" highlight="nos preguntan" />
        <Reveal>
          <Faq />
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
