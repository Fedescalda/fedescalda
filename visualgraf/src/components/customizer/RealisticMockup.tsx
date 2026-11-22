"use client";
import { useEffect, useRef } from "react";
import { compositeInk, drawBag, svgToImage, type BagShape, type BagTexture } from "@/lib/bag-render";

export type BagSpec = { shape: BagShape; texture: BagTexture; wCm: number; hCm: number };

/** Ubicación de la bolsa dentro del canvas (escala fija por cm para comparar medidas). */
export function bagPlacement(spec: BagSpec, cw: number, ch: number) {
  const pad = 0.1;
  const s = Math.min((cw * (1 - pad * 2)) / spec.wCm, (ch * (1 - pad * 2)) / spec.hCm); // px por cm
  const w = spec.wCm * s, h = spec.hCm * s;
  return { x: (cw - w) / 2, y: (ch - h) / 2 - ch * 0.01, w, h, s };
}

export async function paintRealistic(ctx: CanvasRenderingContext2D, spec: BagSpec, cw: number, ch: number, ink: HTMLImageElement | null, background = true) {
  if (background) {
    const g = ctx.createRadialGradient(cw * 0.5, ch * 0.35, 0, cw * 0.5, ch * 0.5, ch * 0.8);
    g.addColorStop(0, "#1c2340");
    g.addColorStop(1, "#070a14");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }
  const place = bagPlacement(spec, cw, ch);
  const rect = await drawBag(ctx, { shape: spec.shape, texture: spec.texture, ...place });
  if (ink) compositeInk(ctx, rect, ink, spec.texture === "cristal" ? 0.92 : 0.96);
  return { rect, place };
}

/** Vista realista interactiva: bolsa con textura de plástico + tu diseño "impreso". */
export function RealisticMockup({
  spec,
  printSvg,
  version,
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  label,
  interactive,
  rectRef,
}: {
  spec: BagSpec;
  printSvg: React.RefObject<SVGSVGElement | null>;
  version: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown?: (cx: number, cy: number, e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (cx: number, cy: number) => void;
  onPointerUp?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLCanvasElement>;
  label: string;
  interactive: boolean;
  /** rectángulo imprimible (px del canvas) del último render, para convertir el puntero a cm */
  rectRef: React.MutableRefObject<{ x: number; y: number; w: number; h: number } | null>;
}) {
  const ticket = useRef(0);
  const CW = 900, CH = 1100;

  useEffect(() => {
    const id = ++ticket.current;
    const raf = requestAnimationFrame(async () => {
      const canvas = canvasRef.current;
      const svg = printSvg.current;
      if (!canvas || !svg) return;
      try {
        const ink = await svgToImage(svg);
        if (id !== ticket.current) return;
        const off = document.createElement("canvas");
        off.width = CW;
        off.height = CH;
        const ctx = off.getContext("2d", { willReadFrequently: true })!;
        const { rect } = await paintRealistic(ctx, spec, CW, CH, ink);
        if (id !== ticket.current) return;
        rectRef.current = rect;
        canvas.width = CW;
        canvas.height = CH;
        canvas.getContext("2d")!.drawImage(off, 0, 0);
      } catch {
        /* se mantiene el último render */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [spec, version, printSvg, canvasRef, rectRef]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * CW, ((e.clientY - r.top) / r.height) * CH] as const;
  };

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      role="img"
      aria-label={label}
      tabIndex={interactive ? 0 : -1}
      className="mx-auto block h-auto w-full max-w-[30rem] rounded-2xl focus-visible:outline-2 focus-visible:outline-brand-cyan"
      style={{ aspectRatio: `${CW} / ${CH}`, touchAction: interactive ? "none" : "auto", cursor: interactive ? "grab" : "default" }}
      onPointerDown={(e) => {
        if (!onPointerDown) return;
        const [x, y] = toCanvas(e);
        onPointerDown(x, y, e);
      }}
      onPointerMove={(e) => {
        if (!onPointerMove) return;
        const [x, y] = toCanvas(e);
        onPointerMove(x, y);
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    />
  );
}
