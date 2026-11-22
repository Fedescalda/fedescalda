import "server-only";
import { normalizeCP, toBultos, type Parcel } from "./andreani-core";

export { normalizeCP, toBultos, type Parcel };

/**
 * Cotizador de Andreani (API pública de tarifas, no requiere login).
 *   GET {ANDREANI_API_URL}/v1/tarifas?cpDestino=&contrato=&cliente=&sucursalOrigen=
 *       &bultos[i][valorDeclarado]=&bultos[i][volumen]=(cm³)&bultos[i][kilos]=(kg)
 *   → { pesoAforado, tarifaSinIva: {...,total}, tarifaConIva: { seguroDistribucion, distribucion, total } }
 * El precio depende del contrato del comercio: ANDREANI_CLIENTE y ANDREANI_CONTRATO los da tu comercial de Andreani.
 */

const API = (process.env.ANDREANI_API_URL || "https://apis.andreani.com").replace(/\/$/, "");

export function andreaniConfigured() {
  return Boolean(process.env.ANDREANI_CLIENTE && process.env.ANDREANI_CONTRATO);
}

const cache = new Map<string, { at: number; value: number | null }>();
const TTL = 15 * 60 * 1000;

/** Devuelve el costo de envío con IVA en ARS, o null si no se pudo cotizar. */
export async function quoteAndreani(opts: { cp: string; parcel: Parcel; valorDeclarado: number }): Promise<number | null> {
  const cliente = process.env.ANDREANI_CLIENTE;
  const contrato = process.env.ANDREANI_CONTRATO;
  const cp = normalizeCP(opts.cp);
  if (!cliente || !contrato || !cp || !(opts.parcel.kilos > 0) || !(opts.parcel.volumen > 0)) return null;

  const bultos = toBultos(opts.parcel);
  const valorPorBulto = Math.round(opts.valorDeclarado / bultos.length);
  const q = new URLSearchParams({ cpDestino: cp, contrato, cliente, sucursalOrigen: process.env.ANDREANI_SUCURSAL_ORIGEN || "" });
  bultos.forEach((b, i) => {
    q.set(`bultos[${i}][valorDeclarado]`, String(valorPorBulto));
    q.set(`bultos[${i}][volumen]`, String(Math.ceil(b.volumen)));
    q.set(`bultos[${i}][kilos]`, b.kilos.toFixed(2));
  });

  const key = q.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  try {
    const res = await fetch(`${API}/v1/tarifas?${key}`, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) {
      console.error("[andreani] tarifa", res.status, (await res.text()).slice(0, 200));
      cache.set(key, { at: Date.now(), value: null });
      return null;
    }
    const data = (await res.json()) as { tarifaConIva?: { total?: string | number } };
    const total = Number(data.tarifaConIva?.total);
    const value = Number.isFinite(total) && total > 0 ? Math.ceil(total) : null;
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 2000) cache.clear();
    return value;
  } catch (e) {
    console.error("[andreani] error", e);
    return null;
  }
}
