import type { ContactKey, FontDef, Layout } from "./layout";

/** Íconos de línea para el bloque de contacto (se dibujan en el color de impresión). */
export function ContactIcon({ kind, x, y, s, color }: { kind: ContactKey; x: number; y: number; s: number; color: string }) {
  const t = `translate(${x} ${y}) scale(${s / 24})`;
  const common = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "instagram")
    return (
      <g transform={t} {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.8" fill={color} />
      </g>
    );
  if (kind === "whatsapp")
    return (
      <g transform={t} {...common}>
        <path d="M4 20l1.3-4A8.5 8.5 0 1 1 8 18.8L4 20Z" />
        <path d="M9 9.5c.3 2.2 2.3 4.3 4.6 4.8l1.1-1.1 1.8.9c-.2 1-1 1.7-2 1.7-3.4-.2-6.2-3-6.4-6.4 0-1 .7-1.8 1.7-2l.9 1.8L9 9.5Z" fill={color} stroke="none" />
      </g>
    );
  if (kind === "web")
    return (
      <g transform={t} {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
      </g>
    );
  return (
    <g transform={t} {...common}>
      <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </g>
  );
}

/**
 * Contenido impreso (logo + textos) en coordenadas de CENTÍMETROS.
 * Se ubica dentro del área de destino con `transform` (escala px/cm y desplazamiento).
 */
export function PrintContent({
  layout,
  logoUrl,
  rotation,
  color,
  font,
  placeholder,
}: {
  layout: Layout;
  logoUrl: string | null;
  rotation: number;
  color: string;
  font: FontDef;
  placeholder?: boolean;
}) {
  const { logo, lines, printW, printH } = layout;
  return (
    <g>
      {logo && logoUrl && (
        <image
          href={logoUrl}
          x={logo.x}
          y={logo.y}
          width={logo.w}
          height={logo.h}
          preserveAspectRatio="xMidYMid meet"
          transform={rotation ? `rotate(${rotation} ${logo.x + logo.w / 2} ${logo.y + logo.h / 2})` : undefined}
        />
      )}
      {!logoUrl && placeholder && (
        <g fill={color} textAnchor="middle" fontFamily={font.family} fontWeight={font.weight}>
          <text x={printW / 2} y={printH * 0.33} fontSize={printW * 0.17}>TU LOGO</text>
          <text x={printW / 2} y={printH * 0.33 + printW * 0.19} fontSize={printW * 0.17}>AQUÍ</text>
        </g>
      )}
      <g fill={color} fontFamily={font.family}>
        {lines.map((l) => {
          if (!l.icon) {
            return (
              <text key={l.key} x={printW / 2} y={l.y} textAnchor="middle" fontWeight={font.weight} fontSize={l.size}>
                {l.text}
              </text>
            );
          }
          const gap = l.size * 0.45;
          return (
            <g key={l.key}>
              <ContactIcon kind={l.icon} x={l.x} y={l.y - l.iconSize * 0.84} s={l.iconSize} color={color} />
              <text x={l.x + l.iconSize + gap} y={l.y} fontSize={l.size} fontWeight={font.weight >= 700 ? 700 : 400}>
                {l.text}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
