"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { ActionResult } from "./ActionForm";
import { bagColors, type Product } from "@/lib/catalog";

type Action = (state: ActionResult, formData: FormData) => Promise<ActionResult>;
type Row = { key: number; size: string; price: string };
type NewImage = { key: number; file: File; url: string };

const categories = [
  { id: "manija-rinon", label: "Manija riñón" },
  { id: "hielo", label: "Bolsas para hielo" },
  { id: "ecommerce", label: "Ecommerce" },
];
const MAX_IMAGES = 8;

/** Achica la foto en el navegador (máx. 1400 px, WEBP) para que la web siga rápida. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

const slugify = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export function ProductEditor({
  action,
  product,
  updatedAt,
  submitLabel,
}: {
  action: Action;
  product?: Product;
  updatedAt?: string;
  submitLabel: string;
}) {
  const isNew = !product;
  const [state, submit, pending] = useActionState(action, {});
  const [compressing, setCompressing] = useState(false);
  const counter = useRef(0);
  const nextKey = () => ++counter.current;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [rows, setRows] = useState<Row[]>(() =>
    (product?.variants.length ? product.variants : [{ size: "", price: null }]).map((v) => ({ key: nextKey(), size: v.size, price: v.price != null ? String(v.price) : "" })),
  );
  const [existing, setExisting] = useState(() => (product?.images ?? []).map((img) => ({ ...img, remove: false })));
  const [added, setAdded] = useState<NewImage[]>([]);

  useEffect(() => () => added.forEach((a) => URL.revokeObjectURL(a.url)), [added]);

  const visibleCount = existing.filter((e) => !e.remove).length + added.length;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_IMAGES - visibleCount;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
    setAdded((prev) => [...prev, ...files.map((file) => ({ key: nextKey(), file, url: URL.createObjectURL(file) }))]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.delete("new_images_picker");
    setCompressing(true);
    const files = await Promise.all(added.map((a) => compress(a.file)));
    setCompressing(false);
    files.forEach((f) => data.append("new_images", f));
    startTransition(() => submit(data));
  }

  const busy = pending || compressing;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {updatedAt && <input type="hidden" name="updated_at" value={updatedAt} />}

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 font-bold">Datos principales</legend>
        <label className="block">
          <span className="label">Nombre *</span>
          <input
            className="field"
            name="name"
            required
            minLength={3}
            maxLength={120}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (isNew && !slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="Ej: Bolsa camiseta personalizada"
          />
        </label>
        {isNew ? (
          <label className="block">
            <span className="label">Link del producto</span>
            <div className="flex items-center gap-2 text-sm text-mute">
              <span className="shrink-0">/productos/</span>
              <input className="field" name="slug" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="se-arma-solo" />
            </div>
          </label>
        ) : (
          <p className="text-sm text-mute">Link: /productos/{product.slug}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Categoría *</span>
            <select className="field" name="category" defaultValue={product?.category ?? "manija-rinon"}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Unidades por pack *</span>
            <input className="field" name="pack_size" type="number" min={1} step={1} required defaultValue={product?.packSize ?? 100} />
          </label>
        </div>
        <label className="block">
          <span className="label">Resumen (se ve en la tarjeta)</span>
          <textarea className="field" name="short" rows={2} maxLength={200} defaultValue={product?.short} placeholder="Ej: Alta densidad, impresa 1 cara 1 color." />
        </label>
        <label className="block">
          <span className="label">Descripción</span>
          <textarea className="field" name="description" rows={5} maxLength={3000} defaultValue={product?.description} />
        </label>
      </fieldset>

      <fieldset className="card space-y-3 p-5">
        <legend className="px-1 font-bold">Medidas y precios *</legend>
        <p className="text-sm text-mute">Precio por pack. Dejalo vacío para mostrar &quot;Consultá precio&quot;.</p>
        {rows.map((row, i) => (
          <div key={row.key} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <label className="block">
              <span className="label">Medida {i + 1}</span>
              <input className="field" name="variant_size" value={row.size} onChange={(e) => setRows((r) => r.map((x) => (x.key === row.key ? { ...x, size: e.target.value } : x)))} placeholder="30 × 40 cm" />
            </label>
            <label className="block">
              <span className="label">Precio (ARS)</span>
              <input className="field" name="variant_price" type="number" min={0} step="any" inputMode="decimal" value={row.price} onChange={(e) => setRows((r) => r.map((x) => (x.key === row.key ? { ...x, price: e.target.value } : x)))} placeholder="A cotizar" />
            </label>
            <button type="button" className="btn btn-ghost !min-h-12 !px-4" disabled={rows.length === 1} onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))} aria-label={`Quitar medida ${i + 1}`}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setRows((r) => [...r, { key: nextKey(), size: "", price: "" }])}>
          + Agregar medida
        </button>
      </fieldset>

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 font-bold">Colores y características</legend>
        <div>
          <span className="label">Colores de bolsa disponibles *</span>
          <div className="flex flex-wrap gap-3">
            {bagColors.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm">
                <input type="checkbox" name="colors" value={c.id} defaultChecked={product ? product.colors.includes(c.id) : ["blanco", "negro", "cristal", "lila"].includes(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="label">Características (una por línea)</span>
          <textarea className="field" name="features" rows={4} defaultValue={product?.features.join("\n")} placeholder={"Alta densidad\nImpresión 1 color"} />
        </label>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} /> Destacado en el inicio</label>
          <label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={product?.active ?? true} /> Visible en la tienda</label>
        </div>
      </fieldset>

      <fieldset className="card space-y-4 p-5">
        <legend className="px-1 font-bold">Fotos * <span className="font-normal text-mute">({visibleCount}/{MAX_IMAGES})</span></legend>
        <p className="text-sm text-mute">La primera foto es la principal. Se achican solas antes de subirse.</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {existing.map((img, i) => (
            <li key={img.src} className={`space-y-2 rounded-xl border border-line p-2 ${img.remove ? "opacity-40" : ""}`}>
              <input type="hidden" name="image_src" value={img.src} />
              <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-3">
                <Image src={img.src} alt={img.alt} fill sizes="200px" className="object-cover" />
                {i === 0 && !img.remove && <span className="absolute top-1 left-1 rounded-full bg-ink/80 px-2 py-0.5 text-xs">Principal</span>}
              </div>
              <input className="field !min-h-9 !py-1.5 text-xs" name="image_alt" defaultValue={img.alt} aria-label={`Descripción de la foto ${i + 1}`} />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="image_remove" value={img.src} checked={img.remove} onChange={(e) => setExisting((list) => list.map((x) => (x.src === img.src ? { ...x, remove: e.target.checked } : x)))} />
                Quitar
              </label>
            </li>
          ))}
          {added.map((img) => (
            <li key={img.key} className="space-y-2 rounded-xl border border-brand-cyan/50 p-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob) */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <span className="absolute top-1 left-1 rounded-full bg-brand-cyan px-2 py-0.5 text-xs text-ink">Nueva</span>
              </div>
              <button type="button" className="text-xs underline" onClick={() => setAdded((l) => l.filter((x) => x.key !== img.key))}>Quitar</button>
            </li>
          ))}
        </ul>
        {visibleCount < MAX_IMAGES && (
          <label className="btn btn-ghost cursor-pointer">
            + Agregar fotos
            <input type="file" name="new_images_picker" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </fieldset>

      {state.error && <p role="alert" className="rounded-xl border border-brand-magenta/50 bg-brand-magenta/10 px-4 py-3">{state.error}</p>}
      {state.success && <p role="status" className="rounded-xl border border-brand-green/50 bg-brand-green/10 px-4 py-3">{state.success}</p>}

      <button className="btn btn-primary w-full sm:w-auto" disabled={busy}>
        {compressing ? "Preparando fotos…" : pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
