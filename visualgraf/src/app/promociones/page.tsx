import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/CtaBand";
import { IconArrow, IconWhatsApp } from "@/components/Icons";
import { getPromotions } from "@/lib/data";
import { formatARS, waLink } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Promociones",
  description: "Promociones vigentes de Visual Graf: packs de bolsas para hielo personalizadas, novedades para ecommerce y más. Consultá vigencia y envío.",
  alternates: { canonical: "/promociones" },
};

export default async function PromocionesPage() {
  const promos = await getPromotions();

  return (
    <>
      <PageHeader eyebrow="Promociones" title="Más bolsas," highlight="mejor precio." text="Packs y novedades para que tu marca llegue más lejos. Consultá vigencia, disponibilidad y costo de envío antes de confirmar tu pedido." />

      <div className="container-vg space-y-8">
        {promos.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-2xl font-black">Pronto vas a ver nuevas promos acá.</p>
            <p className="mt-3 text-mute">Mientras tanto, escribinos y armamos un pack a tu medida.</p>
            <a href={waLink("¡Hola! ¿Tienen alguna promoción vigente?")} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
              <IconWhatsApp /> Consultar promos
            </a>
          </div>
        )}

        {promos.map((p, i) => (
          <Reveal key={p.id}>
            <article className={`card relative grid overflow-hidden md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`} aria-labelledby={`promo-${p.id}`}>
              {p.image && (
                <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[32rem]">
                  <Image src={p.image} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
                </div>
              )}
              <div className="relative flex flex-col justify-center p-6 md:p-12">
                <div className="glow -top-10 -right-10 h-60 w-60 bg-brand-magenta opacity-25" aria-hidden />
                <span className="ring-rainbow relative inline-flex w-fit rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-bold tracking-widest uppercase">{p.badge}</span>
                <h2 id={`promo-${p.id}`} className="relative mt-5 font-display text-3xl leading-tight font-black md:text-5xl">{p.title}</h2>
                <p className="relative mt-4 text-lg text-white/80">{p.description}</p>

                {p.price != null && (
                  <div className="relative mt-6 rounded-3xl border border-line bg-white/5 p-5">
                    {p.priceNote && <p className="eyebrow">{p.priceNote}</p>}
                    <p className="mt-1 font-display text-5xl font-black text-gradient">{formatARS(p.price)}</p>
                  </div>
                )}

                {p.details && p.details.length > 0 && (
                  <table className="relative mt-6 w-full text-left text-sm">
                    <caption className="sr-only">Detalle de la promoción</caption>
                    <thead className="text-mute">
                      <tr>
                        <th scope="col" className="pb-2 font-semibold">Medida</th>
                        <th scope="col" className="pb-2 font-semibold">Cantidad y espesor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {p.details.map((d) => (
                        <tr key={d.label}>
                          <td className="py-2.5 font-semibold">{d.label}</td>
                          <td className="py-2.5 text-white/80">{d.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {p.code && (
                  <p className="relative mt-6 text-sm">
                    Código: <strong className="rounded-lg bg-white/10 px-2 py-1 font-mono tracking-wider">{p.code}</strong>
                    {p.discountPercent ? ` · ${p.discountPercent}% off` : ""}
                  </p>
                )}
                {p.endsAt && <p className="relative mt-3 text-sm text-mute">Válida hasta el {new Date(p.endsAt + "T12:00:00").toLocaleDateString("es-AR")}</p>}

                <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
                  {p.cta && (
                    <Link href={p.cta} className="btn btn-primary">
                      Ver producto <IconArrow />
                    </Link>
                  )}
                  <a href={waLink(`¡Hola Visual Graf! Quiero consultar por la promoción: ${p.title}`)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                    <IconWhatsApp /> Consultar esta promoción
                  </a>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
        <p className="text-center text-sm text-mute">Consultá vigencia, disponibilidad, condiciones y costo de envío antes de confirmar tu pedido.</p>
      </div>

      <CtaBand title="¿Querés una promo para tu negocio?" text="Si comprás en cantidad, contanos qué necesitás y armamos un pack a tu medida." />
    </>
  );
}
