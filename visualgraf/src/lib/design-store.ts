// Guarda en el navegador el diseño armado en el simulador para adjuntarlo al pedido.
export type SavedDesign = {
  mockup: string; // data URL (imagen de la bolsa simulada)
  logo?: string; // data URL del archivo original del logo (si no es muy pesado)
  logoName?: string;
  summary: string; // ej. "Manija riñón · bolsa Negro · impresión Oro"
  savedAt: number;
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

export async function dataUrlToFile(url: string, name: string) {
  const blob = await (await fetch(url)).blob();
  return new File([blob], name, { type: blob.type });
}
