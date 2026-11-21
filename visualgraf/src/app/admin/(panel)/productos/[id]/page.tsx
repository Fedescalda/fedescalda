import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { mapProduct } from "@/lib/data";
import { updateProduct } from "../../../actions";
import { getPanelClient } from "../../../session";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { id } = await params;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) return <p role="alert">No pudimos cargar el producto.</p>;
  if (!data) notFound();

  const product = mapProduct(data);
  return (
    <section className="space-y-4">
      <Link href="/admin/productos" className="inline-block underline">Volvé a Productos</Link>
      <h1 className="text-3xl font-bold">Editá {product.name}</h1>
      <div className="card p-5">
        <ActionForm action={updateProduct.bind(null, id)} label="Guardá el producto">
          <input type="hidden" name="updated_at" value={data.updated_at} />
          <label className="block">
            <span className="label">Nombre</span>
            <input className="field" name="name" defaultValue={product.name} required />
          </label>
          <label className="block">
            <span className="label">Resumen</span>
            <textarea className="field" name="short" defaultValue={product.short} rows={2} />
          </label>
          <label className="block">
            <span className="label">Descripción</span>
            <textarea className="field" name="description" defaultValue={product.description} rows={5} />
          </label>
          <label className="block">
            <span className="label">Características (una por línea)</span>
            <textarea className="field" name="features" defaultValue={product.features.join("\n")} rows={4} />
          </label>
          {product.variants.length > 0 && (
            <fieldset className="space-y-3">
              <legend className="font-bold">Variantes</legend>
              {product.variants.map((variant, index) => (
                <fieldset key={index} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-2">
                  <legend className="px-1 text-sm text-mute">Variante {index + 1}</legend>
                  <label className="block">
                    <span className="label">Tamaño</span>
                    <input className="field" name={`size-${index}`} defaultValue={variant.size} required />
                  </label>
                  <label className="block">
                    <span className="label">Precio por pack (ARS)</span>
                    <input className="field" name={`price-${index}`} type="number" min="0" step="any" defaultValue={variant.price ?? ""} placeholder="A cotizar" />
                  </label>
                </fieldset>
              ))}
            </fieldset>
          )}
          <label className="flex items-center gap-2"><input name="featured" type="checkbox" defaultChecked={product.featured} /> Destacado</label>
          <label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={product.active} /> Activo</label>
        </ActionForm>
      </div>
    </section>
  );
}
