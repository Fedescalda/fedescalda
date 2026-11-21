import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/CtaBand";
import { getProducts } from "@/lib/data";
import { categoryLabel, type Product } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Productos y precios",
  description: "Bolsas manija riñón personalizadas desde $44.000 el pack de 100, bolsas para hielo y para ecommerce. Elegí medida y color y comprá online con envíos a todo el país.",
  alternates: { canonical: "/productos" },
};

const order: Product["category"][] = ["manija-rinon", "hielo", "ecommerce"];
const blurb: Record<Product["category"], string> = {
  "manija-rinon": "Una presentación práctica para acompañar cada compra con tu identidad.",
  hielo: "Distintos formatos con impresión personalizada para identificar tu marca.",
  ecommerce: "La presentación de tu negocio también viaja.",
};

export default async function ProductosPage() {
  const products = await getProducts();
  const groups = order.map((c) => ({ c, items: products.filter((p) => p.category === c) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader eyebrow="Tienda online" title="Bolsas con tu marca," highlight="listas para pedir." text="Elegí la medida y el color, agregá al pedido y coordiná la impresión de tu logo con nosotros. Envíos a toda la Argentina.">
        <nav aria-label="Categorías" className="mt-8 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.c} href={`#${g.c}`} className="rounded-full border border-line bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">
              {categoryLabel[g.c]}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="container-vg space-y-20">
        {groups.map((g) => (
          <section key={g.c} id={g.c} className="scroll-mt-28" aria-labelledby={`h-${g.c}`}>
            <div className="mb-8 flex flex-col justify-between gap-2 md:flex-row md:items-end">
              <h2 id={`h-${g.c}`} className="font-display text-3xl font-black md:text-4xl">{categoryLabel[g.c]}</h2>
              <p className="max-w-md text-mute">{blurb[g.c]}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <ProductCard product={p} priority={i === 0 && g.c === "manija-rinon"} />
                </Reveal>
              ))}
            </div>
          </section>
        ))}
      </div>

      <CtaBand title="¿Necesitás bolsas en cantidad?" text="Contanos qué vendés y cómo entregás tus productos. Te ayudamos con la medida, el formato y la impresión para tu negocio." />
    </>
  );
}
