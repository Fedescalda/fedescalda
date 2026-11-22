"use client";
import { useEffect, useRef } from "react";
import { compositeInk, drawBag, type BagShape, type BagTexture } from "@/lib/bag-render";

/** Medidas "26 × 40 cm" → { w: 26, h: 40 } (o null si no se puede leer). */
export function parseSize(label: string) {
  const m = /(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)/i.exec(label);
  return m ? { w: parseFloat(m[1].replace(",", ".")), h: parseFloat(m[2].replace(",", ".")) } : null;
}

/**
 * Vista previa generada: la bolsa en la medida y el color elegidos, con "TU LOGO AQUÍ"
 * impreso en el color de impresión elegido. Mismo motor realista que el simulador.
 */
export function ProductPreview({
  shape,
  color,
  ink,
  wCm,
  hCm,
  label,
}: {
  shape: BagShape;
  color: BagTexture;
  ink: string;
  wCm: number;
  hCm: number;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ticket = useRef(0);
  const S = 1000;

  useEffect(() => {
    const id = ++ticket.current;
    // no dejar a la vista el color anterior mientras se dibuja el nuevo
    const live = ref.current;
    live?.getContext("2d")?.clearRect(0, 0, S, S);
    (async () => {
      const off = document.createElement("canvas");
      off.width = S;
      off.height = S;
      const ctx = off.getContext("2d", { willReadFrequently: true })!;
      const g = ctx.createRadialGradient(S * 0.5, S * 0.35, 0, S * 0.5, S * 0.5, S * 0.75);
      g.addColorStop(0, "#1c2340");
      g.addColorStop(1, "#070a14");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
      // la bolsa ocupa el cuadro como en una foto de producto (la medida se indica abajo)
      const k = Math.min((S * 0.8) / hCm, (S * 0.78) / wCm);
      const w = wCm * k, h = hCm * k;
      const rect = await drawBag(ctx, { shape, texture: color, x: (S - w) / 2, y: (S - h) / 2 + S * 0.02, w, h });
      if (id !== ticket.current) return;

      // Capa de tinta: "TU LOGO AQUÍ" centrado en el área imprimible
      const inkC = document.createElement("canvas");
      inkC.width = Math.round(rect.w);
      inkC.height = Math.round(rect.h);
      const ic = inkC.getContext("2d")!;
      ic.fillStyle = ink;
      ic.textAlign = "center";
      ic.textBaseline = "middle";
      let fs = rect.w * 0.2;
      ic.font = `900 ${fs}px 'Arial Black', Arial, sans-serif`;
      const tw = ic.measureText("TU LOGO").width;
      if (tw > rect.w * 0.86) {
        fs *= (rect.w * 0.86) / tw;
        ic.font = `900 ${fs}px 'Arial Black', Arial, sans-serif`;
      }
      ic.fillText("TU LOGO", rect.w / 2, rect.h * 0.4);
      ic.fillText("AQUÍ", rect.w / 2, rect.h * 0.4 + fs * 1.05);
      compositeInk(ctx, rect, inkC, color === "cristal" ? 0.92 : 0.96);

      // medida
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = `600 ${S * 0.028}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${wCm} × ${hCm} cm`, S / 2, (S + h) / 2 + S * 0.06);

      const c = ref.current;
      if (!c || id !== ticket.current) return;
      c.getContext("2d")!.drawImage(off, 0, 0);
    })().catch(() => {});
  }, [shape, color, ink, wCm, hCm]);

  return <canvas ref={ref} width={S} height={S} role="img" aria-label={label} className="anim-fade-in absolute inset-0 h-full w-full" />;
}
