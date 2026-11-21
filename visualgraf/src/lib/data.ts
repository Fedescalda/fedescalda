import "server-only";
import { createPublicClient } from "./supabase/server";
import { sampleProducts, samplePromotions, type Product, type Promotion } from "./catalog";

/* Mapeo fila de Supabase → tipo de la app */
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  category: Product["category"];
  images: Product["images"];
  pack_size: number;
  variants: Product["variants"];
  colors: Product["colors"];
  features: string[];
  featured: boolean;
  active: boolean;
};

type PromotionRow = {
  id: string;
  title: string;
  description: string;
  badge: string;
  price: number | null;
  price_note: string | null;
  details: Promotion["details"] | null;
  code: string | null;
  discount_percent: number | null;
  ends_at: string | null;
  image: string | null;
  cta: string | null;
  active: boolean;
};

export const mapProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  short: r.short,
  description: r.description,
  category: r.category,
  images: r.images ?? [],
  packSize: r.pack_size,
  variants: r.variants ?? [],
  colors: r.colors ?? [],
  features: r.features ?? [],
  featured: r.featured,
  active: r.active,
});

export const mapPromotion = (r: PromotionRow): Promotion => ({
  id: r.id,
  title: r.title,
  description: r.description,
  badge: r.badge,
  price: r.price != null ? Number(r.price) : null,
  priceNote: r.price_note,
  details: r.details ?? undefined,
  code: r.code,
  discountPercent: r.discount_percent,
  endsAt: r.ends_at,
  image: r.image,
  cta: r.cta,
  active: r.active,
});

export async function getProducts(): Promise<Product[]> {
  const sb = createPublicClient();
  if (!sb) return sampleProducts;
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true });
  if (error || !data?.length) return sampleProducts;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProduct(slug: string) {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

function isCurrent(p: Promotion) {
  return p.active !== false && (!p.endsAt || new Date(p.endsAt) >= new Date());
}

export async function getPromotions(): Promise<Promotion[]> {
  const sb = createPublicClient();
  if (!sb) return samplePromotions.filter(isCurrent);
  const { data, error } = await sb
    .from("promotions")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error || !data) return samplePromotions.filter(isCurrent);
  return (data as PromotionRow[]).map(mapPromotion).filter(isCurrent);
}

/** Busca un código de promo vigente (para aplicar descuento en el checkout). */
export async function findPromoCode(code: string) {
  const promos = await getPromotions();
  const c = code.trim().toUpperCase();
  return promos.find((p) => p.code?.toUpperCase() === c && p.discountPercent) ?? null;
}
