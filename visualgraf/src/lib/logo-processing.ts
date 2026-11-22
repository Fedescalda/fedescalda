// Procesamiento del logo en el navegador (canvas): quitar fondo blanco,
// recortar márgenes transparentes y teñir con el color de impresión.
// Todo ocurre en el dispositivo del usuario: la imagen no se sube a ningún servidor.

export type LoadedLogo = { img: HTMLImageElement; name: string };

export const MAX_FILE_MB = 8;
export const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];

export function loadLogoFile(file: File): Promise<LoadedLogo> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED.includes(file.type)) return reject(new Error("Formato no soportado. Usá PNG, JPG, WEBP o SVG."));
    if (file.size > MAX_FILE_MB * 1024 * 1024) return reject(new Error(`El archivo supera los ${MAX_FILE_MB} MB.`));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No pudimos leer el archivo."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ img, name: file.name });
      img.onerror = () => reject(new Error("La imagen no se pudo abrir. Probá con otro archivo."));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export type ProcessOptions = {
  removeWhite: boolean;
  /** Color hex para teñir (impresión de 1 color). null = colores originales */
  tint: string | null;
  /** 0-255: cuánto blanco se considera fondo */
  threshold?: number;
};

export type ProcessedLogo = { url: string; width: number; height: number; hadAlpha?: boolean };

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function processLogo(img: HTMLImageElement, opts: ProcessOptions): ProcessedLogo {
  const MAX = 1000;
  const w0 = img.naturalWidth || img.width || 600;
  const h0 = img.naturalHeight || img.height || 600;
  const k = Math.min(1, MAX / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k));
  const h = Math.max(1, Math.round(h0 * k));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  const t = opts.threshold ?? 232;
  const soft = 30;
  const tint = opts.tint ? hexToRgb(opts.tint) : null;

  // Si el logo ya trae transparencia (PNG/SVG recortado), respetamos su forma tal cual:
  // así un logo blanco sobre transparente no desaparece al quitar el "fondo blanco".
  let transparent = 0;
  for (let i = 3; i < d.length; i += 16) if (d[i] < 200) transparent++;
  const hasAlpha = transparent / (d.length / 16) > 0.04;
  const removeWhite = opts.removeWhite && !hasAlpha;

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let i = 0; i < d.length; i += 4) {
    let a = d[i + 3];
    if (removeWhite && a > 0) {
      const m = Math.min(d[i], d[i + 1], d[i + 2]);
      if (m >= t) a = 0;
      else if (m > t - soft) a = Math.round(a * ((t - m) / soft));
    }
    if (tint && a > 0) {
      // Para 1 color: lo oscuro/opaco se imprime, lo claro se vuelve transparente
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      const ink = removeWhite ? Math.min(1, (1 - lum) * 1.6 + 0.15) : 1;
      a = Math.round(a * ink);
      d[i] = tint[0];
      d[i + 1] = tint[1];
      d[i + 2] = tint[2];
    }
    d[i + 3] = a;
    if (a > 16) {
      const p = i / 4, x = p % w, y = (p - x) / w;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(data, 0, 0);

  if (maxX < 0) return { url: c.toDataURL("image/png"), width: w, height: h, hadAlpha: hasAlpha };

  // Recorte de márgenes vacíos
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = cw;
  out.height = ch;
  out.getContext("2d")!.drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);
  return { url: out.toDataURL("image/png"), width: cw, height: ch, hadAlpha: hasAlpha };
}

/** Convierte el SVG de la bolsa en un PNG descargable. */
export async function svgToPng(svg: SVGSVGElement, width = 1200): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(Math.round(width * 1.25)));
  clone.querySelectorAll("[data-ui]").forEach((n) => n.remove());
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("No se pudo generar la imagen"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width * 1.25);
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, "#141433");
    g.addColorStop(1, "#2a0f33");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = `600 ${Math.round(width / 48)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Simulación · Visual Graf · Tu bolsa impresa", canvas.width / 2, canvas.height - width / 40);
    return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Error al exportar"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type LogoAnalysis = {
  width: number;
  height: number;
  /** colores planos detectados (sin contar el fondo blanco/transparente) */
  colors: number;
  /** muchos tonos distintos: degradados, sombras o foto */
  gradient: boolean;
  transparent: boolean;
  vector: boolean;
};

/** Analiza el logo para avisar si sirve para serigrafía (colores planos) y su resolución. */
export function analyzeLogo(img: HTMLImageElement, isSvg: boolean): LogoAnalysis {
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  const k = Math.min(1, 300 / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k));
  const h = Math.max(1, Math.round(h0 * k));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const buckets = new Map<number, number>();
  let opaque = 0;
  let transparentPx = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) {
      transparentPx++;
      continue;
    }
    if (Math.min(d[i], d[i + 1], d[i + 2]) > 232) continue; // fondo blanco
    opaque++;
    const key = ((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5); // 8 niveles por canal
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  // Un "color" cuenta si ocupa al menos 2% de la tinta (descarta bordes antialias)
  const significant = [...buckets.values()].filter((n) => n / Math.max(1, opaque) > 0.02).length;
  const gradient = buckets.size > 40 && significant > 5;
  return {
    width: w0,
    height: h0,
    colors: Math.max(1, significant),
    gradient,
    transparent: transparentPx / (w * h) > 0.04,
    vector: isSvg,
  };
}
