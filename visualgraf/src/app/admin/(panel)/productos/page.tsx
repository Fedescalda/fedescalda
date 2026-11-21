import Image from "next/image";
import Link from "next/link";
import { formatARS } from "@/lib/site";
import { getPanelClient } from "../../session";

type Row = { id: string; name: string; active: boolean; featured: boolean; images: { src: string; alt: string }[]; variants: { price: number | null }[] };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ borrado?: string }> }) {
  const supabase = await getPanelClient();
  if (!supabase) return null;
  const { borrado } = await searchParams;

  const { data, error } = await supabase.from("products").select("id, name, active, featured, images, variants").order("sort").order("name");
  const products = (data ?? []) as Row[];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn btn-primary">+ Nuevo producto</Link>
      </div>
      {borrado && <p role="status" className="rounded-xl border border-brand-green/50 bg-brand-green/10 px-4 py-3">Producto borrado.</p>}
      {error && <p role="alert">No pudimos cargar los productos.</p>}
      {!error && !products.length && <p className="text-mute">Todavía no hay productos.</p>}
      <ul className="space-y-3">
        {products.map((p) => {
          const prices = p.variants.map((v) => v.price).filter((x): x is number => x != null);
          return (
            <li key={p.id} className="card flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-3">
                {p.images[0] && <Image src={p.images[0].src} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">{p.name}</h2>
                <p className="text-sm text-mute">
                  {p.active ? "Visible" : "Oculto"}
                  {p.featured && " · Destacado"} · {p.variants.length} medida{p.variants.length === 1 ? "" : "s"}
                  {prices.length ? ` · desde ${formatARS(Math.min(...prices))}` : " · a cotizar"}
                </p>
              </div>
              <Link href={`/admin/productos/${encodeURIComponent(p.id)}`} className="btn btn-ghost shrink-0">
                Editar<span className="sr-only"> {p.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
