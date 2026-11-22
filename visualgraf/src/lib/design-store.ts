// Guarda en el navegador el diseño armado en el simulador para adjuntarlo al pedido.
export type SavedDesign = {
  mockup: string; // data URL (imagen de la bolsa simulada)
  logo?: string; // data URL del archivo original del logo (si no es muy pesado)
  logoName?: string;
  summary: string; // ej. "Manija riñón · bolsa Negro · impresión Oro"
  savedAt: number;
  /** Datos técnicos del diseño (se guardan con el pedido) */
  meta?: DesignMeta;
};

export type DesignMeta = {
  model: string;
  size: string;
  bagColor: string;
  ink: string;
  multicolor: boolean;
  logoCm: { w: number; h: number } | null;
  rotation: number;
  contact: string[];
  font: string;
  quality?: { dpi: number | null; colors: number; gradient: boolean };
};

const KEY = "vg-design-v1";

export function saveDesign(d: SavedDesign) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    // Si no entra (cuota), guardamos solo la simulación
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...d, logo: undefined }));
      return true;
    } catch {
      return false;
    }
  }
}

export function loadDesign(): SavedDesign | null {
  try {
    const raw = localStorage.getItem(KEY);
    const d = raw ? (JSON.parse(raw) as SavedDesign) : null;
    return d && typeof d.mockup === "string" && d.mockup.startsWith("data:image/") ? d : null;
  } catch {
    return null;
  }
}

export function clearDesign() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(b);
  });

/** Convierte un data URL en File sin usar fetch (la CSP bloquea fetch a data:). */
export async function dataUrlToFile(url: string, name: string) {
  const [head, b64 = ""] = url.split(",");
  const type = /data:([^;]+)/.exec(head)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type });
}
