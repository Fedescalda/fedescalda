// Tipos y datos base del catálogo (tomados de vgtubolsaimpresa.store).
// Si Supabase está configurado, los productos y promociones se leen de la base
// (ver src/lib/data.ts). Estos datos se usan como respaldo y como semilla.

export type BagColorId = "blanco" | "negro" | "cristal" | "lila" | "rosa";

export const bagColors: { id: BagColorId; name: string; hex: string }[] = [
  { id: "blanco", name: "Blanco", hex: "#f5f5f2" },
  { id: "negro", name: "Negro", hex: "#141416" },
  { id: "cristal", name: "Cristal", hex: "#dfe7ee" },
  { id: "lila", name: "Lila pastel", hex: "#c9a7f3" },
  { id: "rosa", name: "Rosa", hex: "#ec3f97" },
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

export type Variant = {
  /** Medida visible, ej. "20 × 30 cm" */
  size: string;
  /** Precio del pack en ARS. null = a cotizar */
  price: number | null;
  image?: string;
  detail?: string;
  /** Peso de un pack en kg (para cotizar envío) */
  kilos?: number | null;
  /** Volumen de un pack en cm³ (largo × ancho × alto del paquete) */
  volumen?: number | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  category: "manija-rinon" | "hielo" | "ecommerce";
  /** color: color de bolsa que muestra la foto (para mostrarla al elegir ese color) */
  images: { src: string; alt: string; color?: BagColorId }[];
  /** Unidades por pack (el precio de cada variante es por pack) */
  packSize: number;
  variants: Variant[];
  colors: BagColorId[];
  features: string[];
  featured?: boolean;
  active?: boolean;
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
  badge: string;
  price?: number | null;
  priceNote?: string | null;
  details?: { label: string; value: string }[];
  code?: string | null;
  discountPercent?: number | null;
  endsAt?: string | null;
  image?: string | null;
  cta?: string | null;
  active?: boolean;
};

export const categoryLabel: Record<Product["category"], string> = {
  "manija-rinon": "Manija riñón",
  hielo: "Bolsas para hielo",
  ecommerce: "Ecommerce",
};

export const sampleProducts: Product[] = [
  {
    id: "manija-rinon-ad",
    slug: "bolsa-manija-rinon-personalizada",
    name: "Bolsa manija riñón personalizada",
    short: "Alta densidad, impresa 1 cara 1 color. Pack de 100 unidades en 5 medidas.",
    description:
      "La bolsa que lleva tu marca a cada lugar. Bolsas manija riñón de alta densidad, personalizadas con el logo, nombre o diseño de tu marca e impresas en serigrafía a 1 cara 1 color. Una presentación profesional para comercios, emprendimientos, tiendas online y marcas que quieren estar presentes en cada compra.",
    category: "manija-rinon",
    images: [
      { src: "/img/productos/manija-rinon-20x30.webp", alt: "Bolsa manija riñón blanca 20 × 30 cm con la leyenda Tu logo aquí", color: "blanco" },
      { src: "/img/productos/manija-rinon-25x35.webp", alt: "Bolsa manija riñón negra 25 × 35 cm con la leyenda Tu logo aquí", color: "negro" },
      { src: "/img/productos/manija-rinon-30x40.webp", alt: "Bolsa manija riñón cristal 30 × 40 cm con la leyenda Tu logo aquí", color: "cristal" },
      { src: "/img/productos/manija-rinon-35x45.webp", alt: "Bolsa manija riñón negra 35 × 45 cm con impresión naranja", color: "negro" },
      { src: "/img/productos/manija-rinon-40x50.webp", alt: "Bolsa manija riñón lila 40 × 50 cm con la leyenda Tu logo aquí", color: "lila" },
    ],
    packSize: 100,
    variants: [
      { size: "20 × 30 cm", price: 44000, image: "/img/productos/manija-rinon-20x30.webp" },
      { size: "25 × 35 cm", price: 47500, image: "/img/productos/manija-rinon-25x35.webp" },
      { size: "30 × 40 cm", price: 52000, image: "/img/productos/manija-rinon-30x40.webp" },
      { size: "35 × 45 cm", price: 57000, image: "/img/productos/manija-rinon-35x45.webp" },
      { size: "40 × 50 cm", price: 67000, image: "/img/productos/manija-rinon-40x50.webp" },
    ],
    colors: ["blanco", "negro", "cristal", "lila"],
    features: ["Alta densidad", "Impresión serigráfica 1 cara 1 color", "4 colores de bolsa", "Mínimo 100 unidades"],
    featured: true,
    active: true,
  },
  {
    id: "hielo-pack-1500",
    slug: "pack-bolsas-para-hielo-personalizadas",
    name: "Pack bolsas para hielo personalizadas ×1500",
    short: "Tres medidas, tu marca en todas. 1.500 bolsas impresas a una cara y un color.",
    description:
      "Un pack de 1.500 bolsas para hielo personalizadas, con impresión a una cara y un color: 500 de 26 × 40 cm (40 mic), 500 de 28 × 50 cm (50 mic) y 500 de 35 × 75 cm (60 mic). Material de baja densidad virgen, apto para contacto con alimentos. Ideal para fábricas de hielo, distribuidoras y almacenes.",
    category: "hielo",
    images: [
      { src: "/img/clientes/thomas.webp", alt: "Bolsa transparente para hielo impresa para Thomas Hielo", color: "cristal" },
      { src: "/img/promo-hielo.webp", alt: "Promoción de 1.500 bolsas para hielo personalizadas por 610.000 pesos" },
      { src: "/img/clientes/thomas-grande.webp", alt: "Bolsa grande para hielo de Thomas Hielo, 8 y 10 kg", color: "cristal" },
    ],
    packSize: 1500,
    variants: [{ size: "Pack 3 medidas (26×40 · 28×50 · 35×75)", price: 610000, detail: "500 + 500 + 500 unidades" }],
    colors: ["cristal"],
    features: ["Baja densidad virgen", "Apto alimentos", "3 medidas", "1 cara 1 color"],
    featured: true,
    active: true,
  },
  {
    id: "hielo-manija-rinon",
    slug: "bolsa-para-hielo-manija-rinon",
    name: "Bolsa para hielo con manija riñón",
    short: "Nuevo ingreso. 26 × 50 cm · 60 micrones. Para llevar el hielo con una mano.",
    description:
      "Bolsa cristal para hielo con manija riñón, pensada para fábricas de hielo, distribuidoras, almacenes y estaciones de servicio. 26 × 50 cm en 60 micrones, resistente al peso y al frío, con tu marca bien visible en cada bolsa. Consultanos cantidades y precio.",
    category: "hielo",
    images: [
      { src: "/img/bolsa-hielo.webp", alt: "Bolsa cristal para hielo con manija riñón y logo azul impreso", color: "cristal" },
      { src: "/img/manija-rinon.webp", alt: "Detalle de la manija riñón de la bolsa para hielo" },
      { src: "/img/tu-logo-aca.webp", alt: "Bolsa para hielo con la leyenda Tu logo acá impresa en azul", color: "cristal" },
    ],
    packSize: 1,
    variants: [{ size: "26 × 50 cm · 60 micrones", price: null }],
    colors: ["cristal"],
    features: ["Manija riñón", "60 micrones", "Resistente al frío", "Impresión personalizada"],
    featured: false,
    active: true,
  },
  {
    id: "ecommerce",
    slug: "bolsas-para-ecommerce",
    name: "Bolsas para ecommerce",
    short: "Novedad. Rosa o negro, resistentes y seguras. Tu marca llega más lejos.",
    description:
      "Dale a cada envío una presentación que se recuerde. Bolsas para ecommerce resistentes y seguras, ideales para envíos, disponibles en rosa y negro. Consultá medidas disponibles y la impresión de tu logo.",
    category: "ecommerce",
    images: [
      { src: "/img/ecommerce-rosa.webp", alt: "Bolsa rosa para ecommerce impresa con la marca Visual Graf", color: "rosa" },
      { src: "/img/promo-ecommerce.webp", alt: "Nuevas bolsas para ecommerce en rosa y negro" },
    ],
    packSize: 1,
    variants: [{ size: "Consultar medidas", price: null }],
    colors: ["rosa", "negro"],
    features: ["Resistentes y seguras", "Ideales para envíos", "Rosa o negro", "Presentación profesional"],
    featured: true,
    active: true,
  },
];

export const samplePromotions: Promotion[] = [
  {
    id: "pack-hielo-1500",
    title: "Tres medidas. Tu marca en todas.",
    description: "Un pack de 1.500 bolsas para hielo personalizadas, con impresión a una cara y un color.",
    badge: "Promoción destacada",
    price: 610000,
    priceNote: "Pack completo · 1.500 unidades en total",
    details: [
      { label: "26 × 40 cm", value: "500 u. · 40 mic" },
      { label: "28 × 50 cm", value: "500 u. · 50 mic" },
      { label: "35 × 75 cm", value: "500 u. · 60 mic" },
    ],
    image: "/img/promo-hielo.webp",
    cta: "/productos/pack-bolsas-para-hielo-personalizadas",
    active: true,
  },
  {
    id: "ecommerce",
    title: "Tu marca llega más lejos",
    description: "Novedad: bolsas para ecommerce en rosa y negro. Resistentes, seguras y con tu logo. Consultá medidas disponibles.",
    badge: "Novedad",
    price: null,
    image: "/img/promo-ecommerce.webp",
    cta: "/productos/bolsas-para-ecommerce",
    active: true,
  },
];

export function fromPrice(p: Product) {
  const prices = p.variants.map((v) => v.price).filter((x): x is number => x != null);
  return prices.length ? Math.min(...prices) : null;
}
