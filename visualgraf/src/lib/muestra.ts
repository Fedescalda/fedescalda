// "Muestra digital" automática con el estilo de Visual Graf:
// encabezado, título degradé, bolsa a escala con cotas, ficha técnica y pie.
import { compositeInk, drawBag, loadImage, type BagShape, type BagTexture } from "./bag-render";

export type MuestraBag = { shape: BagShape; texture: BagTexture; wCm: number; hCm: number; ink: HTMLImageElement | null };
export type MuestraData = {
  title: string; // nombre de la marca / producto
  printCm: { w: number; h: number } | null;
  bags: MuestraBag[]; // 1 o 2 medidas
  tipo: string;
  material: string;
  impresion: string;
  medidas: string;
  web: string;
};

const W = 1206, H = 1706;
const RAINBOW = ["#34d3f3", "#3a64ff", "#9b33f5", "#ff2e93", "#ff7a1c", "#ffc61f"];

function fontFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-montserrat").trim();
  return v || "Montserrat, Arial, sans-serif";
}

function rainbow(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
  return g;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: "left" | "center" | "right" = "left") {
  const chars = [...text];
  const total = chars.reduce((s, c) => s + ctx.measureText(c).width + spacing, -spacing);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
  }
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, weight: number, size: number, fam: string) {
  let s = size;
  ctx.font = `${weight} ${s}px ${fam}`;
  while (ctx.measureText(text).width > maxW && s > 14) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${fam}`;
  }
  return s;
}

function dimLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string, vertical: boolean, fam: string) {
  ctx.strokeStyle = "#e8ecf5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  const t = 8;
  if (vertical) {
    ctx.moveTo(x1 - t, y1); ctx.lineTo(x1 + t, y1);
    ctx.moveTo(x2 - t, y2); ctx.lineTo(x2 + t, y2);
  } else {
    ctx.moveTo(x1, y1 - t); ctx.lineTo(x1, y1 + t);
    ctx.moveTo(x2, y2 - t); ctx.lineTo(x2, y2 + t);
  }
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 26px ${fam}`;
  ctx.textAlign = "center";
  if (vertical) {
    ctx.save();
    ctx.translate(x1 - 26, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(label, (x1 + x2) / 2, y1 - 18);
  }
}

/** Íconos de línea de la ficha técnica */
function icon(ctx: CanvasRenderingContext2D, kind: number, cx: number, cy: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.beginPath();
  if (kind === 0) {
    // bolsa
    ctx.rect(cx - 15, cy - 8, 30, 28);
    ctx.moveTo(cx - 8, cy - 8);
    ctx.arc(cx, cy - 8, 8, Math.PI, 0);
  } else if (kind === 1) {
    // paleta
    ctx.arc(cx, cy, 20, 0.3, Math.PI * 1.9);
    ctx.moveTo(cx - 6, cy - 8); ctx.arc(cx - 8, cy - 8, 2.5, 0, Math.PI * 2);
    ctx.moveTo(cx + 8, cy - 9); ctx.arc(cx + 6, cy - 9, 2.5, 0, Math.PI * 2);
    ctx.moveTo(cx - 9, cy + 6); ctx.arc(cx - 11, cy + 6, 2.5, 0, Math.PI * 2);
  } else if (kind === 2) {
    // impresora
    ctx.rect(cx - 20, cy - 6, 40, 20);
    ctx.rect(cx - 12, cy - 20, 24, 14);
    ctx.rect(cx - 12, cy + 6, 24, 16);
  } else {
    // medidas (flechas a las esquinas)
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.moveTo(cx + dx * 6, cy + dy * 6);
      ctx.lineTo(cx + dx * 18, cy + dy * 18);
      ctx.moveTo(cx + dx * 18, cy + dy * 9);
      ctx.lineTo(cx + dx * 18, cy + dy * 18);
      ctx.lineTo(cx + dx * 9, cy + dy * 18);
    }
  }
  ctx.stroke();
}

export async function renderMuestra(d: MuestraData): Promise<HTMLCanvasElement> {
  const fam = fontFamily();
  await Promise.all([800, 700, 600, 900].map((w) => document.fonts.load(`${w} 40px ${fam}`).catch(() => null)));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;

  // Fondo
  ctx.fillStyle = "#04060c";
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, col] of [[-80, 700, 420, "rgba(58,100,255,0.35)"], [W + 60, 40, 380, "rgba(255,122,28,0.3)"], [W + 40, 1250, 360, "rgba(255,46,147,0.22)"]] as const) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Encabezado
  const logo = await loadImage("/img/logo-512.png").catch(() => null);
  if (logo) ctx.drawImage(logo, 50, 22, 150, 150);
  ctx.fillStyle = "#fff";
  ctx.font = `900 64px ${fam}`;
  ctx.textAlign = "left";
  ctx.fillText("VISUAL GRAF", 215, 100);
  ctx.font = `600 18px ${fam}`;
  spaced(ctx, "TU BOLSA IMPRESA", 228, 135, 9);
  ctx.fillStyle = rainbow(ctx, 0, 0);
  const vg = ctx.createLinearGradient(0, 55, 0, 150);
  RAINBOW.forEach((col, i) => vg.addColorStop(i / 5, col));
  ctx.fillStyle = vg;
  ctx.fillRect(805, 55, 4, 95);
  ctx.fillStyle = "#e9ecf5";
  ctx.font = `600 17px ${fam}`;
  ["IDEAS", "QUE LLEVAN", "TU MARCA", "MÁS LEJOS"].forEach((l, i) => spaced(ctx, l, 840, 70 + i * 25, 5));

  // Título
  ctx.fillStyle = "#fff";
  ctx.font = `600 30px ${fam}`;
  spaced(ctx, "PRESENTACIÓN DE BOLSA", 55, 235, 9);
  fitText(ctx, "MUESTRA DIGITAL", 805, 900, 86, fam);
  ctx.fillStyle = rainbow(ctx, 55, 830);
  ctx.textAlign = "left";
  ctx.fillText("MUESTRA DIGITAL", 52, 320);
  ctx.fillStyle = rainbow(ctx, 55, 700);
  ctx.fillRect(55, 342, 640, 6);
  ctx.fillStyle = "#e9ecf5";
  ctx.font = `600 22px ${fam}`;
  spaced(ctx, "VISTA PREVIA PARA TU APROBACIÓN", 55, 385, 7);

  // Sello "Tu marca en buenas manos"
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(890, 200, 258, 124, 16);
  ctx.strokeStyle = rainbow(ctx, 890, 1148);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(952, 262, 32, 0, Math.PI * 2);
  ctx.strokeStyle = "#34d3f3";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(938, 263);
  ctx.lineTo(949, 275);
  ctx.lineTo(968, 248);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `700 15px ${fam}`;
  ["TU MARCA", "EN BUENAS", "MANOS"].forEach((l, i) => spaced(ctx, l, 1003, 244 + i * 24, 3));
  ctx.restore();

  // Panel central
  ctx.fillStyle = "#08101f";
  ctx.fillRect(0, 400, W, 870);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  fitText(ctx, d.title.toUpperCase(), 1000, 900, 58, fam);
  ctx.fillText(d.title.toUpperCase(), W / 2, 478);
  if (d.printCm) {
    ctx.font = `600 20px ${fam}`;
    ctx.fillStyle = "#d7dbe6";
    ctx.fillText(`Impresión: ${fmt(d.printCm.w)} × ${fmt(d.printCm.h)} cm`, W / 2, 512);
  }

  // Bolsas a escala común
  const areaTop = 600, areaBottom = 1205, areaH = areaBottom - areaTop;
  const n = d.bags.length;
  const slotW = (W - 220) / n;
  const maxHcm = Math.max(...d.bags.map((b) => b.hCm));
  const maxWcm = Math.max(...d.bags.map((b) => b.wCm));
  const s = Math.min(areaH / maxHcm, (slotW - 90) / maxWcm);
  for (let i = 0; i < n; i++) {
    const b = d.bags[i];
    const bw = b.wCm * s, bh = b.hCm * s;
    const x = 150 + slotW * i + (slotW - bw) / 2;
    const y = areaBottom - bh;
    const rect = await drawBag(ctx, { shape: b.shape, texture: b.texture, x, y, w: bw, h: bh });
    if (b.ink) compositeInk(ctx, rect, b.ink, b.texture === "cristal" ? 0.92 : 0.96);
    dimLine(ctx, x, y - 22, x + bw, y - 22, `${fmt(b.wCm)} cm`, false, fam);
    dimLine(ctx, x - 26, y, x - 26, y + bh, `${fmt(b.hCm)} cm`, true, fam);
  }

  // Ficha técnica
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(52, 1268, W - 104, 232, 22);
  ctx.strokeStyle = "rgba(120,160,200,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  const cols = [
    ["TIPO:", d.tipo, "#34d3f3"],
    ["MATERIAL:", d.material, "#ff3b3b"],
    ["IMPRESIÓN:", d.impresion, "#3a64ff"],
    ["MEDIDAS:", d.medidas, "#ffd21f"],
  ] as const;
  const colW = (W - 104) / 4;
  cols.forEach(([k, v, col], i) => {
    const cx = 52 + colW * i + colW / 2;
    icon(ctx, i, cx, 1330, col);
    ctx.fillStyle = "#cfd4e0";
    ctx.font = `600 17px ${fam}`;
    spaced(ctx, k, cx, 1405, 5, "center");
    ctx.fillStyle = "#fff";
    const lines = String(v).toUpperCase().split("\n");
    lines.forEach((ln, j) => {
      fitText(ctx, ln, colW - 30, 800, 26, fam);
      ctx.textAlign = "center";
      ctx.fillText(ln, cx, 1448 + j * 30);
    });
    if (i > 0) {
      ctx.fillStyle = "rgba(120,160,200,0.35)";
      ctx.fillRect(52 + colW * i, 1300, 2, 170);
    }
  });

  // Pie
  ctx.fillStyle = rainbow(ctx, 52, W - 52);
  ctx.fillRect(52, 1530, W - 104, 2);
  ctx.fillStyle = "#fff";
  ctx.font = `italic 400 40px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "left";
  ctx.fillText("Más que bolsas,", 40, 1600);
  ctx.font = `700 18px ${fam}`;
  ctx.fillStyle = rainbow(ctx, 150, 430);
  spaced(ctx, "HACEMOS MARCA", 152, 1635, 7);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(478, 1555, 2, 90);
  ctx.fillStyle = "#e9ecf5";
  ctx.font = `600 19px ${fam}`;
  ctx.fillText(`🌐  ${d.web}`, 510, 1612);
  ctx.fillStyle = "#fff";
  ctx.font = `900 30px ${fam}`;
  ctx.textAlign = "right";
  ctx.fillText("VISUAL GRAF", W - 52, 1595);
  ctx.font = `600 12px ${fam}`;
  ctx.fillStyle = "#cfd4e0";
  spaced(ctx, "TU BOLSA IMPRESA", W - 52, 1620, 5, "right");
  ctx.fillStyle = rainbow(ctx, 0, W);
  ctx.fillRect(0, H - 8, W, 8);
  return c;
}

const fmt = (v: number) => v.toLocaleString("es-AR", { maximumFractionDigits: 2 });
