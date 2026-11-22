import "server-only";
import { createPublicClient } from "./supabase/server";
import { andreaniConfigured, quoteAndreani, type Parcel } from "./andreani";

export type ShippingZone = { id: string; name: string; price: number | null; provinces: string[] };
export type ShippingConfig = {
  enabled: boolean;
  /** "zonas": precio fijo por zona · "andreani": cotización en vivo (las zonas quedan de respaldo) */
  provider: "zonas" | "andreani";
  /** Recargo sobre la tarifa de Andreani (embalaje, margen). 0 = tarifa exacta */
  markupPercent: number;
  freeFrom: number | null;
  zones: ShippingZone[];
};

const DISABLED: ShippingConfig = { enabled: false, provider: "zonas", markupPercent: 0, freeFrom: null, zones: [] };

export async function getShippingConfig(): Promise<ShippingConfig> {
  const sb = createPublicClient();
  if (!sb) return DISABLED;
  const { data } = await sb.from("settings").select("value").eq("key", "shipping").maybeSingle();
  const v = data?.value as Partial<ShippingConfig> | undefined;
  if (!v) return DISABLED;
  return {
    enabled: Boolean(v.enabled),
    provider: v.provider === "andreani" ? "andreani" : "zonas",
    markupPercent: Number.isFinite(Number(v.markupPercent)) ? Number(v.markupPercent) : 0,
    freeFrom: v.freeFrom ?? null,
    zones: Array.isArray(v.zones) ? v.zones : [],
  };
}

/**
 * Cotiza el envío para una provincia.
 * price = null significa "a coordinar" (envíos sin configurar o zona sin precio).
 */
export async function quoteShipping(province: string, subtotal: number, opts: { cp?: string; parcel?: Parcel | null } = {}) {
  const cfg = await getShippingConfig();
  if (cfg.enabled && cfg.freeFrom != null && subtotal >= cfg.freeFrom) {
    return { price: 0, zone: cfg.provider === "andreani" ? "Andreani a domicilio" : (cfg.zones.find((z) => z.provinces.includes(province))?.name ?? "Envío"), free: true };
  }
  // Andreani en vivo: necesita código postal y peso/volumen de todos los productos
  if (cfg.enabled && cfg.provider === "andreani" && andreaniConfigured() && opts.cp && opts.parcel) {
    const tarifa = await quoteAndreani({ cp: opts.cp, parcel: opts.parcel, valorDeclarado: subtotal });
    if (tarifa != null) {
      const price = Math.ceil((tarifa * (1 + cfg.markupPercent / 100)) / 10) * 10; // redondeo a $10
      return { price, zone: "Andreani a domicilio", free: false };
    }
  }
  const zone = cfg.zones.find((z) => z.provinces.includes(province));
  if (!cfg.enabled || !zone || zone.price == null) return { price: null as number | null, zone: zone?.name ?? null, free: false };
  if (cfg.freeFrom != null && subtotal >= cfg.freeFrom) return { price: 0, zone: zone.name, free: true };
  return { price: zone.price, zone: zone.name, free: false };
}

/** Datos para pago por transferencia (variables de entorno). */
export function transferInfo() {
  const alias = process.env.TRANSFER_ALIAS || "";
  const cbu = process.env.TRANSFER_CBU || "";
  if (!alias && !cbu) return null;
  return { alias, cbu, holder: process.env.TRANSFER_HOLDER || "", bank: process.env.TRANSFER_BANK || "", cuit: process.env.TRANSFER_CUIT || "" };
}
