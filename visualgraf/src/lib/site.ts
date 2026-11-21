// Configuración central del sitio. Los datos de contacto salen de variables
// de entorno públicas (NEXT_PUBLIC_*) para poder cambiarlos sin tocar código.

export const site = {
  name: "VisualGraf",
  displayName: "Visual Graf",
  tagline: "Tu bolsa impresa",
  description:
    "Bolsas personalizadas con tu logo para comercios y emprendimientos. Bolsas manija riñón, para hielo y para ecommerce, impresas en serigrafía. Comprá online con envíos a toda la Argentina.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "5493364622890",
  whatsappDisplay: "+54 9 3364 62-2890",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@vgtubolsaimpresa.store",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "visualgraf.tubolsaimpresa",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK || "visualgraf.tubolsaimpresa",
  city: process.env.NEXT_PUBLIC_CITY || "",
  locale: "es_AR",
};

export const nav = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/personalizar", label: "Personalizar" },
  { href: "/promociones", label: "Promociones" },
  { href: "/nuestra-historia", label: "Nuestra historia" },
  { href: "/contacto", label: "Contacto" },
];

/** Arma un link de WhatsApp con mensaje precargado. */
export function waLink(message?: string) {
  const base = `https://wa.me/${site.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value);
}
