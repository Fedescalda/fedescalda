// Render realista de bolsas en canvas a partir de texturas PROPIAS de plástico
// (public/img/bags/*.webp, generadas con scripts/generate-bag-textures.py).

export type BagShape = "rinon" | "hielo" | "hielo-rinon" | "ecommerce";
export type BagTexture = "blanco" | "negro" | "cristal" | "lila" | "rosa";

/** Proporción del área imprimible dentro de la bolsa: [x0, y0, x1, y1] (0–1). */
export const PRINT_BOX: Record<BagShape, [number, number, number, number]> = {
  rinon: [0.16, 0.17, 0.84, 0.88],
  hielo: [0.11, 0.2, 0.89, 0.8],
  "hielo-rinon": [0.11, 0.24, 0.89, 0.84],
  ecommerce: [0.1, 0.16, 0.9, 0.88],
};

const cache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      }),
    );
  }
  return cache.get(src)!;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Agujero de la manija (riñón troquelado o manija riñón de hielo) como sub-trazado. */
function holePath(ctx: CanvasRenderingContext2D, shape: BagShape, x: number, y: number, w: number, h: number) {
  if (shape === "rinon") {
    const hw = w * 0.3, hh = Math.max(10, w * 0.075);
    roundRect(ctx, x + (w - hw) / 2, y + h * 0.055, hw, hh, hh / 2);
  } else if (shape === "hielo-rinon") {
    const hw = w * 0.4, top = y + h * 0.05, cx = x + w / 2, hh = w * 0.09;
    ctx.moveTo(cx - hw / 2, top + hh * 0.55);
    ctx.quadraticCurveTo(cx, top - hh * 0.15, cx + hw / 2, top + hh * 0.55);
    ctx.quadraticCurveTo(cx + hw / 2 + hh * 0.2, top + hh * 1.05, cx + hw / 2 - hh * 0.25, top + hh * 1.05);
    ctx.quadraticCurveTo(cx, top + hh * 0.55, cx - hw / 2 + hh * 0.25, top + hh * 1.05);
    ctx.quadraticCurveTo(cx - hw / 2 - hh * 0.2, top + hh * 1.05, cx - hw / 2, top + hh * 0.55);
    ctx.closePath();
  }
}

/** Dibuja la bolsa y devuelve el rectángulo imprimible en px. */
export async function drawBag(
  ctx: CanvasRenderingContext2D,
  opts: { shape: BagShape; texture: BagTexture; x: number; y: number; w: number; h: number },
) {
  const { shape, texture, x, y, w, h } = opts;
  const tex = await loadImage(`/img/bags/${texture}.webp`);
  const r = Math.max(2, w * 0.006);
  const isClear = texture === "cristal";

  ctx.save();
  // Silueta con agujero (evenodd) y sombra suave
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, r);
  holePath(ctx, shape, x, y, w, h);
  ctx.shadowColor = isClear ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.45)";
  ctx.shadowBlur = w * 0.06;
  ctx.shadowOffsetY = w * 0.025;
  ctx.fillStyle = isClear ? "rgba(255,255,255,0.08)" : "#888";
  ctx.fill("evenodd");
  ctx.shadowColor = "transparent";
  ctx.clip("evenodd");

  // Textura (cubre la bolsa manteniendo proporción)
  const k = Math.max(w / tex.width, h / tex.height);
  const tw = tex.width * k, th = tex.height * k;
  ctx.drawImage(tex, x + (w - tw) / 2, y + (h - th) / 2, tw, th);

  // Sellos y detalles
  const sealLight = isClear ? "rgba(255,255,255,0.35)" : texture === "negro" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
  ctx.fillStyle = sealLight;
  if (shape === "rinon") {
    ctx.fillRect(x, y + h - h * 0.018, w, h * 0.018);
  } else if (shape === "hielo") {
    ctx.fillRect(x, y, w, h * 0.022);
    ctx.fillRect(x, y + h - h * 0.022, w, h * 0.022);
  } else if (shape === "hielo-rinon") {
    ctx.fillRect(x, y, w, h * 0.02);
    ctx.fillRect(x, y + h * 0.15, w, h * 0.012);
    ctx.fillRect(x, y + h - h * 0.02, w, h * 0.02);
  } else if (shape === "ecommerce") {
    ctx.fillStyle = texture === "negro" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.1)";
    ctx.fillRect(x, y, w, h * 0.075);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillRect(x + w * 0.04, y + h * 0.075, w * 0.92, h * 0.022); // cinta adhesiva
  }
  // Volumen en los bordes laterales
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  const edge = isClear ? "rgba(255,255,255,0.18)" : texture === "negro" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.12)";
  g.addColorStop(0, edge);
  g.addColorStop(0.06, "rgba(0,0,0,0)");
  g.addColorStop(0.94, "rgba(0,0,0,0)");
  g.addColorStop(1, edge);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // Contorno fino (marca el borde del plástico, sobre todo en cristal)
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, r);
  holePath(ctx, shape, x, y, w, h);
  ctx.lineWidth = Math.max(1, w * 0.003);
  ctx.strokeStyle = isClear ? "rgba(255,255,255,0.55)" : texture === "blanco" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
  ctx.stroke();
  ctx.restore();

  const [a, b, c, d] = PRINT_BOX[shape];
  return { x: x + w * a, y: y + h * b, w: w * (c - a), h: h * (d - b) };
}

/**
 * "Imprime" la capa de tinta sobre lo que ya está dibujado en `rect`:
 * toma luces/sombras de la superficie y se desplaza levemente con los pliegues.
 */
export function compositeInk(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }, ink: CanvasImageSource, opacity = 0.96) {
  const rx = Math.round(rect.x), ry = Math.round(rect.y), rw = Math.round(rect.w), rh = Math.round(rect.h);
  if (rw < 3 || rh < 3) return;
  const region = ctx.getImageData(rx, ry, rw, rh);
  const p = region.data;
  const c = document.createElement("canvas");
  c.width = rw;
  c.height = rh;
  const ictx = c.getContext("2d", { willReadFrequently: true })!;
  ictx.drawImage(ink, 0, 0, rw, rh);
  const q = ictx.getImageData(0, 0, rw, rh).data;

  const lum = new Float32Array(rw * rh);
  let sum = 0;
  for (let i = 0, j = 0; j < lum.length; i += 4, j++) {
    lum[j] = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    sum += lum[j];
  }
  const ref = Math.max(1, sum / lum.length);
  const disp = 0.03;
  for (let y = 1; y < rh - 1; y++) {
    for (let x = 1; x < rw - 1; x++) {
      const j = y * rw + x;
      const sx = Math.min(rw - 1, Math.max(0, Math.round(x - (lum[j + 1] - lum[j - 1]) * disp)));
      const sy = Math.min(rh - 1, Math.max(0, Math.round(y - (lum[j + rw] - lum[j - rw]) * disp)));
      const k = (sy * rw + sx) * 4;
      const a = (q[k + 3] / 255) * opacity;
      if (a <= 0.003) continue;
      const shade = Math.min(1.2, Math.max(0.7, lum[j] / ref));
      const o = j * 4;
      p[o] = p[o] * (1 - a) + Math.min(255, q[k] * shade) * a;
      p[o + 1] = p[o + 1] * (1 - a) + Math.min(255, q[k + 1] * shade) * a;
      p[o + 2] = p[o + 2] * (1 - a) + Math.min(255, q[k + 2] * shade) * a;
    }
  }
  ctx.putImageData(region, rx, ry);
}

export function svgToImage(svg: SVGSVGElement) {
  // Se clona sin el estilo que la oculta en la página (si no, se exporta de 1×1 px)
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => {
      URL.revokeObjectURL(url);
      res(i);
    };
    i.onerror = (e) => {
      URL.revokeObjectURL(url);
      rej(e);
    };
    i.src = url;
  });
}
