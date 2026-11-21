import "server-only";
import { createAdminClient, createPublicClient } from "./supabase/server";
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
  code?: string | null;
  discount_percent?: number | null;
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
  code: r.code ?? null,
  discountPercent: r.discount_percent ?? null,
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
  if (error) {
    console.error("[data] Error leyendo productos de Supabase:", error.message);
    return [];
  }
  // Solo publicamos productos completos (con fotos y al menos una variante)
  return (data as ProductRow[]).map(mapProduct).filter((p) => p.images.length > 0 && p.variants.length > 0);
}

export async function getProduct(slug: string) {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

function isCurrent(p: Promotion) {
  return p.active !== false && (!p.endsAt || new Date(p.endsAt) >= new Date());
}

// Columnas que puede leer el público (sin code ni discount_percent)
const PUBLIC_PROMO_COLUMNS = "id,slug,title,description,badge,price,price_note,details,ends_at,image,cta,active,created_at";

export async function getPromotions(): Promise<Promotion[]> {
  const sb = createPublicClient();
  if (!sb) return samplePromotions.filter(isCurrent);
  const { data, error } = await sb
    .from("promotions")
    .select(PUBLIC_PROMO_COLUMNS)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) console.error("[data] Error leyendo promociones de Supabase:", error.message);
    return [];
  }
  return (data as unknown as PromotionRow[]).map(mapPromotion).filter(isCurrent);
}

/** Busca un código de promo vigente (solo servidor: los códigos no son públicos en la base). */
export async function findPromoCode(code: string) {
  const c = code.trim().toUpperCase();
  if (!c) return null;
  const sb = createAdminClient();
  if (!sb) return samplePromotions.filter(isCurrent).find((p) => p.code?.toUpperCase() === c && p.discountPercent) ?? null;
  const { data } = await sb.from("promotions").select("*").eq("active", true).ilike("code", c).limit(1).maybeSingle();
  if (!data) return null;
  const promo = mapPromotion(data as PromotionRow);
  return isCurrent(promo) && promo.discountPercent ? promo : null;
}
