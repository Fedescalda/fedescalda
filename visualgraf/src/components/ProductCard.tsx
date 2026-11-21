import Image from "next/image";
import Link from "next/link";
import { formatARS } from "@/lib/site";
import { categoryLabel, fromPrice, type Product } from "@/lib/catalog";
import { IconArrow } from "./Icons";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const from = fromPrice(product);
  const img = product.images[0];
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group card flex h-full flex-col overflow-hidden transition duration-500 hover:-translate-y-1.5 hover:border-white/25 hover:shadow-[0_30px_60px_-30px_rgba(155,51,245,.55)]"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-3">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-[1.05]"
        />
        <span className="absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold backdrop-blur">
          {categoryLabel[product.category]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg leading-tight font-extrabold">{product.name}</h3>
        <p className="mt-2 text-sm text-mute">{product.short}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {from != null ? (
            <p className="text-sm text-mute">
              {product.variants.length > 1 ? "Desde " : ""}
              <span className="font-display text-xl font-extrabold text-white">{formatARS(from)}</span>
              <span className="block text-xs">por {product.packSize.toLocaleString("es-AR")} unidades impresas</span>
            </p>
          ) : (
            <p className="font-display text-base font-extrabold text-brand-cyan">Consultá precio</p>
          )}
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 transition group-hover:bg-white group-hover:text-ink" aria-hidden>
            <IconArrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
