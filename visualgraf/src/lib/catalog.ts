// Tipos y datos de ejemplo del catálogo.
// Si Supabase está configurado, los productos y promociones se leen de la base
// (ver src/lib/data.ts). Estos datos se usan como respaldo y como semilla.

export type BagColorId = "blanco" | "negro" | "cristal" | "lila";

export const bagColors: { id: BagColorId; name: string; hex: string }[] = [
  { id: "blanco", name: "Blanco", hex: "#f5f5f2" },
  { id: "negro", name: "Negro", hex: "#141416" },
  { id: "cristal", name: "Cristal", hex: "#dfe7ee" },
  { id: "lila", name: "Lila pastel", hex: "#c9a7f3" },
];

export const inkColors: { id: string; name: string; hex: string }[] = [
  { id: "negro", name: "Negro", hex: "#111111" },
  { id: "blanco", name: "Blanco", hex: "#ffffff" },
  { id: "rojo", name: "Rojo", hex: "#e3161b" },
  { id: "magenta", name: "Magenta", hex: "#e5197f" },
  { id: "azul", name: "Azul", hex: "#1f37d6" },
  { id: "amarillo", name: "Amarillo", hex: "#f7d21b" },
  { id: "verde", name: "Verde", hex: "#22913d" },
  { id: "celeste", name: "Celeste", hex: "#7fc8f0" },
  { id: "oro", name: "Oro", hex: "#c9a03f" },
  { id: "plata", name: "Plata", hex: "#b9bdc4" },
  { id: "rosa", name: "Rosa", hex: "#f39bc4" },
];

export type PriceTier = { min: number; unitPrice: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  category: "troquelada" | "hielo";
  images: { src: string; alt: string }[];
  sizes: string[];
  colors: BagColorId[];
  /** Precio por unidad (ARS) según cantidad mínima. Ordenado de menor a mayor cantidad. */
  tiers: PriceTier[];
  features: string[];
  featured?: boolean;
  active?: boolean;
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
  badge: string;
  code?: string | null;
  discountPercent?: number | null;
  endsAt?: string | null;
  image?: string | null;
  active?: boolean;
};

// ⚠️ PRECIOS DE EJEMPLO: reemplazar por los reales desde el panel admin o Supabase.
export const sampleProducts: Product[] = [
  {
    id: "troquelada",
    slug: "bolsa-troquelada-personalizada",
    name: "Bolsa troquelada personalizada",
    short: "La clásica para locales y emprendimientos. Manija troquelada y tu logo impreso.",
    description:
      "Bolsa de polietileno con manija troquelada, ideal para indumentaria, regalería, cosmética y comercios en general. Elegí el color de bolsa y el color de impresión que mejor representen a tu marca. Impresión en serigrafía, nítida y resistente.",
    category: "troquelada",
    images: [
      { src: "/img/bolsa-blanca.webp", alt: "Bolsa troquelada blanca con logo marrón impreso" },
      { src: "/img/bolsa-negra.webp", alt: "Bolsa troquelada negra con logo blanco impreso" },
      { src: "/img/bolsa-cristal.webp", alt: "Bolsa troquelada cristal con logo blanco impreso" },
      { src: "/img/bolsa-lila.webp", alt: "Bolsa troquelada lila pastel con logo negro impreso" },
    ],
    sizes: ["20 × 30 cm", "30 × 40 cm", "40 × 50 cm"],
    colors: ["blanco", "negro", "cristal", "lila"],
    tiers: [
      { min: 100, unitPrice: 320 },
      { min: 500, unitPrice: 240 },
      { min: 1000, unitPrice: 190 },
    ],
    features: ["4 colores de bolsa", "11 colores de impresión", "Impresión en serigrafía", "1 o 2 caras"],
    featured: true,
    active: true,
  },
  {
    id: "hielo-rinon",
    slug: "bolsa-para-hielo-manija-rinon",
    name: "Bolsa para hielo con manija riñón",
    short: "26 × 50 cm · 60 micrones. Para llevar el hielo con una mano.",
    description:
      "Nuevo ingreso. Bolsa cristal para hielo con manija riñón, pensada para fábricas de hielo, distribuidoras, almacenes y estaciones de servicio. 26 × 50 cm en 60 micrones, resistente al peso y al frío. Tu marca bien visible en cada bolsa.",
    category: "hielo",
    images: [
      { src: "/img/bolsa-hielo.webp", alt: "Bolsa cristal para hielo con manija riñón y logo azul impreso" },
      { src: "/img/manija-rinon.webp", alt: "Detalle de la manija riñón de la bolsa para hielo" },
      { src: "/img/tu-logo-aca.webp", alt: "Bolsa para hielo con la leyenda Tu logo acá impresa en azul" },
    ],
    sizes: ["26 × 50 cm · 60 micrones"],
    colors: ["cristal"],
    tiers: [
      { min: 500, unitPrice: 210 },
      { min: 1000, unitPrice: 170 },
      { min: 3000, unitPrice: 140 },
    ],
    features: ["Manija riñón", "60 micrones", "Resistente al frío", "Ideal 2 a 3 kg"],
    featured: true,
    active: true,
  },
  {
    id: "hielo-clasica",
    slug: "bolsa-para-hielo-clasica",
    name: "Bolsa para hielo clásica",
    short: "Cristal, para cerrar con precinto o nudo. Tu marca en cada bolsa.",
    description:
      "¿Vendés hielo? Poné tu marca en cada bolsa. Bolsa cristal para hielo, para cerrar con precinto o nudo, con impresión de tu logo, teléfono y peso aproximado. Ideal para hielo en rolitos o cubos.",
    category: "hielo",
    images: [
      { src: "/img/bolsa-hielo-rolito.webp", alt: "Bolsa de hielo cristal cerrada con precinto y logo Tu Rolito impreso en azul" },
    ],
    sizes: ["2 kg aprox.", "4 kg aprox."],
    colors: ["cristal"],
    tiers: [
      { min: 1000, unitPrice: 95 },
      { min: 3000, unitPrice: 80 },
      { min: 5000, unitPrice: 68 },
    ],
    features: ["Cristal", "Cierre con precinto", "Impresión 1 color", "Alta producción"],
    featured: true,
    active: true,
  },
];

// ⚠️ PROMOCIONES DE EJEMPLO: revisarlas o reemplazarlas antes de publicar.
export const samplePromotions: Promotion[] = [
  {
    id: "primer-pedido",
    title: "10% off en tu primer pedido",
    description: "Si es la primera vez que imprimís tus bolsas con nosotros, usá el código al finalizar tu pedido.",
    badge: "Nuevos clientes",
    code: "PRIMERA10",
    discountPercent: 10,
    active: true,
  },
  {
    id: "hielo",
    title: "Bolsas para hielo: precio de temporada",
    description: "Preparate para el verano. Llevando 3000 unidades o más accedés al mejor precio por unidad.",
    badge: "Temporada de verano",
    code: null,
    discountPercent: null,
    image: "/img/bolsa-hielo.webp",
    active: true,
  },
  {
    id: "combo-emprendedor",
    title: "Combo emprendedor",
    description: "500 bolsas troqueladas impresas + adaptación de tu logo para serigrafía sin cargo.",
    badge: "Combo",
    code: "COMBO500",
    discountPercent: 5,
    image: "/img/bolsas-colores.webp",
    active: true,
  },
];

export function unitPriceFor(product: Pick<Product, "tiers">, qty: number) {
  const sorted = [...product.tiers].sort((a, b) => a.min - b.min);
  let price = sorted[0]?.unitPrice ?? 0;
  for (const t of sorted) if (qty >= t.min) price = t.unitPrice;
  return price;
}

export function minQty(product: Pick<Product, "tiers">) {
  return Math.min(...product.tiers.map((t) => t.min));
}
