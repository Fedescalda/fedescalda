import { ActionForm } from "@/components/admin/ActionForm";
import type { Promotion } from "@/lib/catalog";
import { mapPromotion } from "@/lib/data";
import { deletePromotion, savePromotion } from "../../actions";
import { getPanelClient } from "../../session";

function PromotionForm({ promotion }: { promotion?: Promotion }) {
  return (
    <ActionForm
      action={savePromotion.bind(null, promotion?.id ?? null)}
      label={promotion ? "Guardá los cambios" : "Creá la promoción"}
      resetOnSuccess={!promotion}
    >
      <label className="block">
        <span className="label">Título</span>
        <input className="field" name="title" defaultValue={promotion?.title} required />
      </label>
      <label className="block">
        <span className="label">Descripción</span>
        <textarea className="field" name="description" defaultValue={promotion?.description} rows={3} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Etiqueta</span>
          <input className="field" name="badge" defaultValue={promotion?.badge ?? "Promo"} />
        </label>
        <label className="block">
          <span className="label">Vencimiento</span>
          <input className="field" name="ends_at" type="date" defaultValue={promotion?.endsAt ?? ""} />
        </label>
        <label className="block">
          <span className="label">Precio (ARS)</span>
          <input className="field" name="price" type="number" min="0" step="any" defaultValue={promotion?.price ?? ""} />
        </label>
        <label className="block">
          <span className="label">Nota del precio</span>
          <input className="field" name="price_note" defaultValue={promotion?.priceNote ?? ""} />
        </label>
        <label className="block">
          <span className="label">Ruta de la imagen en el sitio</span>
          <input className="field" name="image" defaultValue={promotion?.image ?? ""} placeholder="/img/promo.webp" />
        </label>
        <label className="block">
          <span className="label">Destino del botón</span>
          <input className="field" name="cta" defaultValue={promotion?.cta ?? ""} placeholder="/productos" />
        </label>
      </div>
      <label className="flex items-center gap-2">
        <input name="active" type="checkbox" defaultChecked={promotion?.active ?? true} /> Activa
      </label>
    </ActionForm>
  );
}

export default async function PromotionsPage() {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
  const promotions = (data ?? []).map(mapPromotion);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Promociones</h1>
      <details className="card p-5">
        <summary className="cursor-pointer font-bold">Creá una promoción</summary>
        <div className="mt-4"><PromotionForm /></div>
      </details>
      {error && <p role="alert">No pudimos cargar las promociones.</p>}
      {!error && !promotions.length && <p className="text-mute">Todavía no hay promociones.</p>}
      {promotions.map((promotion) => (
        <details key={promotion.id} className="card p-5">
          <summary className="cursor-pointer break-words font-bold">
            {promotion.title} <span className="font-normal text-mute">· {promotion.active ? "Activa" : "Inactiva"}</span>
          </summary>
          <div className="mt-4 space-y-4">
            <PromotionForm promotion={promotion} />
            <div className="border-t border-line pt-4">
              <ActionForm action={deletePromotion.bind(null, promotion.id)} label="Borrá la promoción" confirm={`¿Querés borrar «${promotion.title}»?`} secondary />
            </div>
          </div>
        </details>
      ))}
    </section>
  );
}
