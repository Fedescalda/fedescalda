// Diagramación del diseño en CENTÍMETROS reales dentro del área imprimible.
// La misma diagramación se dibuja sobre la foto real o sobre la ilustración.

export type ContactKey = "instagram" | "whatsapp" | "web" | "address";
export type FontDef = { id: string; name: string; family: string; weight: number };

export type LayoutInput = {
  printW: number; // cm
  printH: number; // cm
  logoRatio: number | null; // alto/ancho del logo (null = sin logo)
  scale: number; // 0.2–1 del ancho disponible
  pos: { x: number; y: number }; // centro normalizado 0–1
  slogan: string;
  contact: { key: ContactKey; text: string }[];
  font: FontDef;
};

export type TextLine = { key: string; text: string; x: number; y: number; size: number; icon?: ContactKey; iconSize: number; width: number };
export type Layout = {
  printW: number;
  printH: number;
  logo: { x: number; y: number; w: number; h: number } | null;
  lines: TextLine[];
};

let ctx: CanvasRenderingContext2D | null = null;
/** Ancho real del texto (en las mismas unidades que `size`) usando la tipografía elegida. */
function measure(text: string, size: number, font: FontDef) {
  if (typeof document === "undefined") return text.length * size * 0.58;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * size * 0.58;
  ctx.font = `${font.weight} 100px ${font.family}`;
  return (ctx.measureText(text).width / 100) * size;
}

export function computeLayout(i: LayoutInput): Layout {
  const { printW, printH, font } = i;
  const maxTextW = printW * 0.94;
  // Tamaño base de los textos proporcional al ancho imprimible (≈ 0,55–1 cm)
  const base = Math.min(1, Math.max(0.45, printW * 0.05));
  const lines: TextLine[] = [];
  let cursor = 0; // alto acumulado del bloque inferior

  const rows: { key: string; text: string; size: number; icon?: ContactKey }[] = [];
  if (i.slogan.trim()) rows.push({ key: "slogan", text: i.slogan.trim(), size: base * 1.2 });
  i.contact.forEach((c) => rows.push({ key: c.key, text: c.text, size: base, icon: c.key }));

  // Ajuste al ancho: si una línea no entra, se achica (nunca se corta)
  const fitted = rows.map((r) => {
    const iconSize = r.icon ? r.size * 1.1 : 0;
    const gap = r.icon ? r.size * 0.45 : 0;
    let size = r.size;
    let w = measure(r.text, size, font) + iconSize + gap;
    if (w > maxTextW) {
      const k = maxTextW / w;
      size *= k;
      w = maxTextW;
    }
    return { ...r, size, iconSize: r.icon ? size * 1.1 : 0, width: w, lineH: size * 1.55 };
  });
  // Si los textos ocupan más de la mitad del alto, se achican todos parejo
  const rawH = fitted.reduce((s, r) => s + r.lineH, 0);
  if (rawH > printH * 0.5) {
    const k = (printH * 0.5) / rawH;
    fitted.forEach((r) => {
      r.size *= k;
      r.lineH *= k;
      r.width *= k;
      r.iconSize *= k;
    });
  }
  const blockH = fitted.reduce((s, r) => s + r.lineH, 0) + (fitted.length ? base * 0.4 : 0);
  const blockTop = printH - blockH;
  fitted.forEach((r) => {
    cursor += r.lineH;
    lines.push({ key: r.key, text: r.text, size: r.size, icon: r.icon, iconSize: r.iconSize, width: r.width, x: (printW - r.width) / 2, y: blockTop + cursor - r.lineH * 0.3 });
  });

  let logo: Layout["logo"] = null;
  if (i.logoRatio) {
    const availH = Math.max(printH * 0.25, blockTop - base * 0.6);
    let w = printW * i.scale;
    let h = w * i.logoRatio;
    const maxH = availH * i.scale;
    if (h > maxH) {
      h = maxH;
      w = h / i.logoRatio;
    }
    const cx = printW * i.pos.x;
    const cy = Math.min(printH * i.pos.y, blockTop - h / 2 - base * 0.3);
    logo = { w, h, x: cx - w / 2, y: Math.max(0, cy - h / 2) };
  }
  return { printW, printH, logo, lines };
}
