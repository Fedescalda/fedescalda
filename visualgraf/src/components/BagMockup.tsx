import type { BagColorId } from "@/lib/catalog";

export type BagModel = "rinon" | "hielo" | "ecommerce";

/** Área imprimible (coordenadas del viewBox 400×500) por modelo. */
export const printArea: Record<BagModel, { x: number; y: number; w: number; h: number }> = {
  rinon: { x: 82, y: 128, w: 236, h: 300 },
  hielo: { x: 118, y: 150, w: 164, h: 290 },
  ecommerce: { x: 70, y: 120, w: 260, h: 320 },
};

const palette: Record<BagColorId, { base: string; edge: string; shade: string; light: number; alpha: number }> = {
  blanco: { base: "#f7f7f4", edge: "#d9d9d4", shade: "#000", light: 0.55, alpha: 1 },
  negro: { base: "#18181c", edge: "#050506", shade: "#000", light: 0.18, alpha: 1 },
  cristal: { base: "#e9f1f8", edge: "#ffffff", shade: "#5b6b82", light: 0.6, alpha: 0.28 },
  lila: { base: "#c8a6f2", edge: "#ad86df", shade: "#3b1f63", light: 0.4, alpha: 1 },
  rosa: { base: "#ec3f97", edge: "#c92a7a", shade: "#4d0a2c", light: 0.35, alpha: 1 },
};

/**
 * Bolsa en SVG puro. `children` se dibuja dentro del área imprimible,
 * por encima de los brillos, para que textos y logo se lean nítidos.
 */
export function BagMockup({
  model = "rinon",
  color = "blanco",
  id = "bag",
  children,
  className,
  title,
  svgRef,
  onPointerDown,
}: {
  model?: BagModel;
  color?: BagColorId;
  id?: string;
  children?: React.ReactNode;
  className?: string;
  title?: string;
  svgRef?: React.Ref<SVGSVGElement>;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
}) {
  const c = palette[color];
  const isCristal = color === "cristal";
  const shape = {
    rinon: "M44 34 Q200 26 356 34 L370 470 Q200 482 30 470 Z",
    hielo: "M96 18 L304 18 Q308 250 312 486 L88 486 Q92 250 96 18 Z",
    ecommerce: "M42 40 L358 40 L362 474 L38 474 Z",
  }[model];
  const hole =
    model === "rinon" ? (
      <rect x="152" y="66" width="96" height="30" rx="15" fill="#000" />
    ) : model === "hielo" ? (
      <path d="M146 60 Q200 40 254 60 Q268 68 258 86 Q200 68 142 86 Q132 68 146 60 Z" fill="#000" />
    ) : null;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 500"
      className={className}
      role="img"
      aria-label={title ?? `Bolsa ${model === "hielo" ? "para hielo" : model === "ecommerce" ? "para ecommerce" : "manija riñón"} color ${color}`}
      onPointerDown={onPointerDown}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id={`${id}-mask`}>
          <rect width="400" height="500" fill="#fff" />
          {hole}
        </mask>
        <clipPath id={`${id}-clip`}>
          <path d={shape} />
        </clipPath>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={c.light} />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.62" stopColor="#fff" stopOpacity={c.light * 0.45} />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" x2="1">
          <stop offset="0" stopColor={c.shade} stopOpacity="0.22" />
          <stop offset="0.12" stopColor={c.shade} stopOpacity="0" />
          <stop offset="0.88" stopColor={c.shade} stopOpacity="0" />
          <stop offset="1" stopColor={c.shade} stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={`${id}-floor`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>

      </defs>

      {/* sombra en el piso */}
      <ellipse cx="200" cy="486" rx="190" ry="14" fill={`url(#${id}-floor)`} />

      <g mask={`url(#${id}-mask)`}>
        {/* cuerpo */}
        <path d={shape} fill={c.base} fillOpacity={c.alpha} stroke={c.edge} strokeOpacity={isCristal ? 0.9 : 0.6} strokeWidth={isCristal ? 2 : 1} />

        <g clipPath={`url(#${id}-clip)`}>
          {/* cristal: reflejos internos */}
          {isCristal && (
            <g opacity="0.55">
              <path d="M60 120 L140 60 L180 300 L90 420 Z" fill="#fff" opacity="0.12" />
              <path d="M240 90 L330 160 L300 430 L220 380 Z" fill="#fff" opacity="0.1" />
            </g>
          )}


          {/* volumen y brillos sobre la impresión */}
          <rect width="400" height="500" fill={`url(#${id}-side)`} />
          <rect width="400" height="500" fill={`url(#${id}-sheen)`} style={{ mixBlendMode: "screen" }} />
          <g stroke="#fff" strokeOpacity={isCristal ? 0.5 : 0.18} strokeWidth="1.2" fill="none">
            <path d="M70 160 Q120 210 96 300" />
            <path d="M300 120 Q270 240 320 360" />
            <path d="M150 420 Q210 400 260 436" />
          </g>
          <g stroke={c.shade} strokeOpacity={color === "negro" ? 0 : 0.08} strokeWidth="6" fill="none">
            <path d="M76 168 Q126 218 102 308" />
            <path d="M306 128 Q276 248 326 368" />
          </g>

          {/* costuras */}
          {model === "rinon" ? (
            <path d="M34 462 Q200 474 366 462" stroke={c.shade} strokeOpacity="0.18" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          ) : model === "ecommerce" ? (
            <>
              {/* solapa con cinta adhesiva */}
              <rect x="42" y="40" width="316" height="52" fill={c.shade} fillOpacity="0.14" />
              <rect x="70" y="56" width="260" height="18" rx="3" fill="#fff" fillOpacity={color === "negro" ? 0.12 : 0.45} />
              <path d="M42 92 L358 92" stroke={c.shade} strokeOpacity="0.35" strokeWidth="1.5" />
            </>
          ) : (
            <>
              <path d="M92 116 L308 116" stroke={isCristal ? "#fff" : c.shade} strokeOpacity="0.5" strokeWidth="1.5" />
              <path d="M92 122 L308 122" stroke={isCristal ? "#fff" : c.shade} strokeOpacity="0.25" strokeWidth="1" />
              <path d="M90 476 L310 476" stroke={c.shade} strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="2 3" />
              {isCristal &&
                [
                  [130, 180, 3], [270, 210, 2.5], [150, 330, 2], [250, 390, 3.5], [200, 250, 2], [120, 420, 2.5], [285, 300, 2],
                ].map(([x, y, r], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r={r} fill="#fff" opacity="0.5" />
                    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill="#fff" />
                  </g>
                ))}
            </>
          )}
          {/* impresión: arriba de brillos y costuras para que se lea nítida */}
          <g style={{ mixBlendMode: "normal" }}>{children}</g>
        </g>
      </g>

      {/* borde del troquel */}
      <g fill="none" stroke={isCristal ? "#fff" : c.shade} strokeOpacity={isCristal ? 0.7 : 0.25}>{model === "rinon" ? <rect x="152" y="66" width="96" height="30" rx="15" /> : null}</g>
    </svg>
  );
}
