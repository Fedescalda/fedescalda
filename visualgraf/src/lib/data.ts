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
  sizes: string[];
  colors: Product["colors"];
  tiers: Product["tiers"];
  features: string[];
  featured: boolean;
  active: boolean;
};

type PromotionRow = {
  id: string;
  title: string;
  description: string;
  badge: string;
  code: string | null;
  discount_percent: number | null;
  ends_at: string | null;
  image: string | null;
  active: boolean;
};

export const mapPromotion = (r: PromotionRow): Promotion => ({
  id: r.id,
  title: r.title,
  description: r.description,
  badge: r.badge,
  code: r.code,
  discountPercent: r.discount_percent,
  endsAt: r.ends_at,
  image: r.image,
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
  return data as ProductRow[];
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
