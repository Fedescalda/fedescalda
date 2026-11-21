import Link from "next/link";
import { getPanelClient } from "../../session";

export default async function ProductsPage() {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { data: products, error } = await supabase.from("products")
    .select("id, name, active, featured").order("sort").order("name");

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Productos</h1>
      {error && <p role="alert">No pudimos cargar los productos.</p>}
      {!error && !products?.length && <p className="text-mute">Todavía no hay productos.</p>}
      <ul className="space-y-3">
        {products?.map((product) => (
          <li key={product.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="font-bold">{product.name}</h2>
              <p className="text-mute">{product.active ? "Activo" : "Inactivo"}{product.featured && " · Destacado"}</p>
            </div>
            <Link href={`/admin/productos/${encodeURIComponent(product.id)}`} className="btn btn-ghost">
              Editá<span className="sr-only"> {product.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
