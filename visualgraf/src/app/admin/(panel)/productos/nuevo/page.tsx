import Link from "next/link";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { createProduct } from "../../../actions";
import { getPanelClient } from "../../../session";

export default async function NewProductPage() {
  const supabase = await getPanelClient();
  if (!supabase) return null;
  return (
    <section className="space-y-4">
      <Link href="/admin/productos" className="inline-block underline">Volvé a Productos</Link>
      <h1 className="text-3xl font-bold">Nuevo producto</h1>
      <ProductEditor action={createProduct} submitLabel="Crear producto" />
    </section>
  );
}
