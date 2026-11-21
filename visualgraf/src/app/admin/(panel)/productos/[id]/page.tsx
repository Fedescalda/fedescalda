import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { mapProduct } from "@/lib/data";
import { deleteProduct, updateProduct } from "../../../actions";
import { getPanelClient } from "../../../session";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string }> }) {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { id } = await params;
  const { creado } = await searchParams;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) return <p role="alert">No pudimos cargar el producto.</p>;
  if (!data) notFound();

  const product = mapProduct(data);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/productos" className="inline-block underline">Volvé a Productos</Link>
        <Link href={`/productos/${product.slug}`} target="_blank" className="text-sm underline">Ver en la tienda ↗</Link>
      </div>
      <h1 className="text-3xl font-bold">Editá {product.name}</h1>
      {creado && <p role="status" className="rounded-xl border border-brand-green/50 bg-brand-green/10 px-4 py-3">¡Producto creado! Ya está en la tienda{product.active ? "" : " (oculto hasta que lo actives)"}.</p>}
      {/* key: al guardar cambia updated_at y el formulario se reinicia con los datos nuevos */}
      <ProductEditor key={data.updated_at} action={updateProduct.bind(null, id)} product={product} updatedAt={data.updated_at} submitLabel="Guardar cambios" />
      <div className="card border-brand-magenta/40 p-5">
        <h2 className="font-bold">Borrar producto</h2>
        <p className="mb-3 text-sm text-mute">Se borra de la tienda junto con sus fotos. Si solo querés ocultarlo, desmarcá &quot;Visible en la tienda&quot;.</p>
        <ActionForm action={deleteProduct.bind(null, id)} label="Borrar producto" secondary confirm={`¿Seguro que querés borrar "${product.name}"? No se puede deshacer.`} />
      </div>
    </section>
  );
}
