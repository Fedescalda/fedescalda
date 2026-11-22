// Funciones puras de Andreani (sin red ni server-only), usadas por andreani.ts y los tests.

const MAX_KG_PER_BULTO = 25;

/** "S2000ABC", "2000", "B1754" → "2000" / "1754" (código postal numérico de 4 dígitos). */
export function normalizeCP(raw: string) {
  const m = /(\d{4})/.exec(raw.replace(/\s/g, ""));
  return m ? m[1] : null;
}

export type Parcel = { kilos: number; volumen: number };

/** Agrupa el pedido en bultos de hasta 25 kg (reparte peso y volumen en partes iguales). */
export function toBultos(total: Parcel) {
  const n = Math.max(1, Math.ceil(total.kilos / MAX_KG_PER_BULTO));
  return Array.from({ length: n }, () => ({ kilos: total.kilos / n, volumen: total.volumen / n }));
}

