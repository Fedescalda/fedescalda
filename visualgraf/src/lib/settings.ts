import "server-only";
import { createPublicClient } from "./supabase/server";

export type ShippingZone = { id: string; name: string; price: number | null; provinces: string[] };
export type ShippingConfig = { enabled: boolean; freeFrom: number | null; zones: ShippingZone[] };

const DISABLED: ShippingConfig = { enabled: false, freeFrom: null, zones: [] };

export async function getShippingConfig(): Promise<ShippingConfig> {
  const sb = createPublicClient();
  if (!sb) return DISABLED;
  const { data } = await sb.from("settings").select("value").eq("key", "shipping").maybeSingle();
  const v = data?.value as Partial<ShippingConfig> | undefined;
  if (!v) return DISABLED;
  return { enabled: Boolean(v.enabled), freeFrom: v.freeFrom ?? null, zones: Array.isArray(v.zones) ? v.zones : [] };
}

/**
 * Cotiza el envío para una provincia.
 * price = null significa "a coordinar" (envíos sin configurar o zona sin precio).
 */
export async function quoteShipping(province: string, subtotal: number) {
  const cfg = await getShippingConfig();
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
