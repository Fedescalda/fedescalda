"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { BagColorId } from "@/lib/catalog";
import type { BagShape, BagTexture } from "@/lib/bag-render";
import { ProductPreview } from "./ProductPreview";

type Img = { src: string; alt: string; color?: BagColorId };
export type GallerySelection = { color: BagColorId; colorName: string; inkHex: string; inkName: string; shape: BagShape; wCm: number; hCm: number; sizeLabel: string };

/**
 * Galería de la ficha: muestra la foto de ejemplo del color de bolsa elegido (sin importar la medida);
 * si no hay foto de ese color, una vista previa generada en ese color.
 */
export function Gallery({
  images,
  selection,
}: {
  images: Img[];
  selection: GallerySelection;
}) {
  // -1 = vista previa generada. Las fotos son de ejemplo: se elige por color, no por medida.
  const auto = useMemo(() => {
    const byColor = images.findIndex((i) => i.color === selection.color);
    return byColor >= 0 ? byColor : -1;
  }, [images, selection.color]);

  // Selección manual (miniaturas) atada al color: al cambiar de color se ignora sin parpadeo
  const [manualSel, setManualSel] = useState<{ color: BagColorId; index: number } | null>(null);
  const setManual = (index: number) => setManualSel({ color: selection.color, index });
  const index = manualSel && manualSel.color === selection.color ? manualSel.index : auto;
  const current = index >= 0 ? images[index] : null;
  const previewLabel = `Vista previa: bolsa ${selection.sizeLabel} color ${selection.colorName} con impresión ${selection.inkName}`;

  return (
    <div className="lg:sticky lg:top-28">
      <div data-product-image className="relative aspect-square overflow-hidden rounded-[2rem] border border-line bg-ink-3">
        {current ? (
          <Image key={current.src} src={current.src} alt={current.alt} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="animate-[fadein_.5s_ease] object-cover" />
        ) : (
          <ProductPreview shape={selection.shape} color={selection.color as BagTexture} ink={selection.inkHex} wCm={selection.wCm} hCm={selection.hCm} label={previewLabel} />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold backdrop-blur">
          {current ? (current.color === selection.color ? `Foto de ejemplo · ${selection.colorName}` : "Foto de ejemplo") : `Vista previa · ${selection.colorName}`}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-5 gap-2.5" aria-label="Imágenes del producto">
        <li>
          <button
            type="button"
            onClick={() => setManual(-1)}
            aria-label={previewLabel}
            aria-current={index === -1}
            className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl border-2 bg-ink-3 text-[0.65rem] font-semibold transition ${index === -1 ? "border-white" : "border-transparent opacity-70 hover:opacity-100"}`}
          >
            <span className="h-1/2 w-2/5 rounded-sm border border-white/30" style={{ background: selection.color === "cristal" ? "linear-gradient(135deg,#ffffff66,#cfe3f322)" : undefined, backgroundColor: selection.color === "cristal" ? undefined : swatch(selection.color) }} aria-hidden />
            <span className="absolute bottom-1">Vista previa</span>
          </button>
        </li>
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              onClick={() => setManual(i)}
              aria-label={`Ver foto ${i + 1}: ${img.alt}`}
              aria-current={i === index}
              className={`relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition ${i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <Image src={img.src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const swatch = (c: string) => ({ blanco: "#f2f2f0", negro: "#151517", lila: "#c9a7f3", rosa: "#ec3f97" })[c] ?? "#999";
