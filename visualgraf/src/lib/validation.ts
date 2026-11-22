import { z } from "zod";

export const provinces = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy",
  "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz",
  "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
] as const;

const txt = (max: number) => z.string().trim().max(max);

export const contactSchema = z.object({
  name: txt(80).min(2, "Ingresá tu nombre"),
  business: txt(80).optional().default(""),
  email: z.string().trim().email("Ingresá un email válido").max(120),
  phone: txt(30).optional().default(""),
  province: txt(40).optional().default(""),
  interest: txt(60).optional().default(""),
  message: txt(2000).min(5, "Contanos un poco más"),
  website: z.string().max(0).optional().default(""), // honeypot: debe quedar vacío
});

export const customerSchema = z.object({
  name: txt(80).min(2, "Ingresá tu nombre"),
  email: z.string().trim().email("Ingresá un email válido").max(120),
  phone: txt(30).min(6, "Ingresá un teléfono"),
  business: txt(80).optional().default(""),
  cuit: txt(20).optional().default(""),
  province: txt(40).min(2, "Elegí tu provincia"),
  city: txt(60).min(2, "Ingresá tu localidad"),
  address: txt(120).min(3, "Ingresá tu dirección"),
  zip: txt(10).min(4, "Ingresá tu código postal"),
  notes: txt(500).optional().default(""),
});

export const orderSchema = z.object({
  customer: customerSchema,
  items: z
    .array(
      z.object({
        productId: z.string().max(60),
        size: z.string().max(80),
        bagColor: z.string().max(30),
        inkColor: z.string().max(30),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1, "Tu pedido está vacío")
    .max(30),
  paymentMethod: z.enum(["mercadopago", "transferencia", "whatsapp"]),
  logoLater: z.boolean().optional().default(false),
  promoCode: txt(30).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export type OrderInput = z.infer<typeof orderSchema>;

/** Rate limit muy simple en memoria (best effort por instancia). */
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max = 5, windowMs = 60_000) {
  if (process.env.RATE_LIMIT_OFF === "1") return false; // solo para tests e2e
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k);
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
}
