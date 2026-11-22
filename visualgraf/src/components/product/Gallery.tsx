"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Gallery({ images, activeSrc }: { images: { src: string; alt: string }[]; activeSrc?: string }) {
  const [manual, setManual] = useState<number | null>(null);
  useEffect(() => setManual(null), [activeSrc]);
  const fromVariant = activeSrc ? images.findIndex((i) => i.src === activeSrc) : -1;
  const index = manual ?? (fromVariant >= 0 ? fromVariant : 0);
  const current = images[index] ?? images[0];

  return (
    <div className="lg:sticky lg:top-28">
      <div data-product-image className="relative aspect-square overflow-hidden rounded-[2rem] border border-line bg-ink-3">
        <Image key={current.src} src={current.src} alt={current.alt} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="animate-[fadein_.5s_ease] object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2.5" aria-label="Más fotos">
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
      )}
    </div>
  );
}
