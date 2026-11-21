import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Configurator } from "@/components/product/Configurator";
import { ProductCard } from "@/components/ProductCard";
import { Faq } from "@/components/Faq";
import { getProduct, getProducts } from "@/lib/data";
import { categoryLabel, fromPrice } from "@/lib/catalog";
import { site } from "@/lib/site";
import { faqs } from "@/lib/content";
import { jsonLd as safeJson } from "@/lib/jsonld";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.short} ${p.description.slice(0, 90)}…`,
    alternates: { canonical: `/productos/${p.slug}` },
    openGraph: { title: `${p.name} · Visual Graf`, description: p.short, images: [{ url: p.images[0].src, alt: p.images[0].alt }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const related = (await getProducts()).filter((p) => p.id !== product.id).slice(0, 3);
  const price = fromPrice(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => `${site.url}${i.src}`),
    brand: { "@type": "Brand", name: site.displayName },
    ...(price != null && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "ARS",
        lowPrice: price,
        highPrice: Math.max(...product.variants.map((v) => v.price ?? 0)),
        offerCount: product.variants.length,
        availability: "https://schema.org/InStock",
      },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJson(jsonLd)} />
      <div className="container-vg pt-28 md:pt-32">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-mute">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-white">Inicio</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/productos" className="hover:text-white">Productos</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/productos#${product.category}`} className="hover:text-white">{categoryLabel[product.category]}</Link></li>
          </ol>
        </nav>

        <Suspense>
          <Configurator product={product} />
        </Suspense>

        <section className="mt-20 grid gap-10 lg:grid-cols-[1.1fr_1fr]" aria-labelledby="descripcion">
          <div>
            <h2 id="descripcion" className="font-display text-2xl font-black md:text-3xl">Descripción</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/80">{product.description}</p>
            <p className="mt-4 text-white/80">En Visual Graf nos ocupamos de que tu bolsa no solo sirva para llevar tu producto, sino que también lleve tu marca.</p>
          </div>
          <div className="card p-6 md:p-8">
            <h2 className="font-display text-xl font-black">¿Cómo sigue tu compra?</h2>
            <ol className="mt-5 space-y-4">
              {[
                ["Hacés tu pedido", "Pagás online con Mercado Pago o lo cerrás por WhatsApp."],
                ["Nos mandás tu logo", "Por WhatsApp, con tu número de pedido. Si hace falta, lo adaptamos."],
                ["Aprobás el diseño", "Te mostramos cómo queda antes de imprimir."],
                ["Producimos y enviamos", "Coordinamos el envío a tu localidad, en cualquier lugar del país."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-sm font-black" style={{ background: "var(--rainbow)" }}>{i + 1}</span>
                  <span>
                    <span className="block font-semibold">{t}</span>
                    <span className="text-sm text-mute">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="faq-prod">
          <h2 id="faq-prod" className="mb-8 text-center font-display text-2xl font-black md:text-3xl">Antes de hacer tu pedido</h2>
          <Faq items={faqs.slice(0, 4)} />
        </section>

        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="relacionados">
            <h2 id="relacionados" className="mb-8 font-display text-2xl font-black md:text-3xl">También te puede servir</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
