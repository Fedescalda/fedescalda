"use client";
import { useEffect, useRef } from "react";
import type { PhotoMockup as Photo } from "@/lib/mockups";

/** Ubicación del área imprimible (en cm) dentro del rectángulo de la foto (en px). */
export function fitPrint(photo: Photo, printW: number, printH: number) {
  const [rx, ry, rw, rh] = photo.rect;
  const s = Math.min(rw / printW, rh / printH); // px por cm
  return { s, ox: rx + (rw - printW * s) / 2, oy: ry + (rh - printH * s) / 2 };
}

const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  if (!imgCache.has(src)) {
    imgCache.set(
      src,
      new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = src;
      }),
    );
  }
  return imgCache.get(src)!;
}

function svgToImage(svg: SVGSVGElement) {
  const xml = new XMLSerializer().serializeToString(svg);
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

/**
 * Foto real + impresión. La "tinta" (capa SVG rasterizada) se combina con la foto:
 *  - toma las luces y sombras del plástico (multiplica por la luminancia relativa)
 *  - se desplaza levemente siguiendo los pliegues (mapa de desplazamiento por gradiente)
 */
export function PhotoMockup({
  photo,
  printSvg,
  version,
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  label,
  interactive,
}: {
  photo: Photo;
  printSvg: React.RefObject<SVGSVGElement | null>;
  version: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown?: (photoX: number, photoY: number, e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (photoX: number, photoY: number) => void;
  onPointerUp?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLCanvasElement>;
  label: string;
  interactive: boolean;
}) {
  const ticket = useRef(0);

  useEffect(() => {
    const id = ++ticket.current;
    const raf = requestAnimationFrame(async () => {
      const canvas = canvasRef.current;
      const svg = printSvg.current;
      if (!canvas || !svg) return;
      try {
        const [base, ink] = await Promise.all([loadImage(photo.src), svgToImage(svg)]);
        if (id !== ticket.current) return; // llegó un cambio más nuevo
        canvas.width = photo.w;
        canvas.height = photo.h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(base, 0, 0, photo.w, photo.h);

        const [rx, ry, rw, rh] = photo.rect;
        const region = ctx.getImageData(rx, ry, rw, rh);
        const p = region.data;

        const inkCanvas = document.createElement("canvas");
        inkCanvas.width = rw;
        inkCanvas.height = rh;
        const ictx = inkCanvas.getContext("2d", { willReadFrequently: true })!;
        ictx.drawImage(ink, 0, 0, rw, rh);
        const q = ictx.getImageData(0, 0, rw, rh).data;

        // Luminancia de la foto y referencia (promedio) para el sombreado
        const lum = new Float32Array(rw * rh);
        let sum = 0;
        for (let i = 0, j = 0; j < lum.length; i += 4, j++) {
          const l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
          lum[j] = l;
          sum += l;
        }
        const ref = Math.max(1, sum / lum.length);
        const op = photo.inkOpacity;
        const disp = 0.035; // px de desplazamiento por unidad de gradiente

        for (let y = 1; y < rh - 1; y++) {
          for (let x = 1; x < rw - 1; x++) {
            const j = y * rw + x;
            const dx = (lum[j + 1] - lum[j - 1]) * disp;
            const dy = (lum[j + rw] - lum[j - rw]) * disp;
            const sx = Math.min(rw - 1, Math.max(0, Math.round(x - dx)));
            const sy = Math.min(rh - 1, Math.max(0, Math.round(y - dy)));
            const k = (sy * rw + sx) * 4;
            const a = (q[k + 3] / 255) * op;
            if (a <= 0.003) continue;
            const shade = Math.min(1.22, Math.max(0.62, lum[j] / ref));
            const o = j * 4;
            p[o] = p[o] * (1 - a) + Math.min(255, q[k] * shade) * a;
            p[o + 1] = p[o + 1] * (1 - a) + Math.min(255, q[k + 1] * shade) * a;
            p[o + 2] = p[o + 2] * (1 - a) + Math.min(255, q[k + 2] * shade) * a;
          }
        }
        ctx.putImageData(region, rx, ry);
      } catch {
        // si algo falla, queda la foto sola
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [photo, version, printSvg, canvasRef]);

  const toPhoto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * photo.w, ((e.clientY - r.top) / r.height) * photo.h] as const;
  };

  return (
    <canvas
      ref={canvasRef}
      width={photo.w}
      height={photo.h}
      role="img"
      aria-label={label}
      tabIndex={interactive ? 0 : -1}
      className="mx-auto block h-auto w-full max-w-[26rem] rounded-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] focus-visible:outline-2 focus-visible:outline-brand-cyan"
      style={{ aspectRatio: `${photo.w} / ${photo.h}`, touchAction: interactive ? "none" : "auto", cursor: interactive ? "grab" : "default" }}
      onPointerDown={(e) => {
        if (!onPointerDown) return;
        const [x, y] = toPhoto(e);
        onPointerDown(x, y, e);
      }}
      onPointerMove={(e) => {
        if (!onPointerMove) return;
        const [x, y] = toPhoto(e);
        onPointerMove(x, y);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    />
  );
}
