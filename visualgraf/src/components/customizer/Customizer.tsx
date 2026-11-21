"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BagMockup, printArea, type BagModel } from "../BagMockup";
import { bagColors, inkColors, type BagColorId } from "@/lib/catalog";
import { ACCEPTED, loadLogoFile, processLogo, svgToPng, type LoadedLogo, type ProcessedLogo } from "@/lib/logo-processing";
import { waLink } from "@/lib/site";
import { IconBag, IconDownload, IconUpload, IconWhatsApp } from "../Icons";

const models: { id: BagModel; name: string; colors: BagColorId[]; product: string }[] = [
  { id: "rinon", name: "Manija riñón", colors: ["blanco", "negro", "cristal", "lila"], product: "/productos/bolsa-manija-rinon-personalizada" },
  { id: "hielo", name: "Para hielo", colors: ["cristal", "blanco"], product: "/productos/pack-bolsas-para-hielo-personalizadas" },
  { id: "ecommerce", name: "Ecommerce", colors: ["rosa", "negro"], product: "/productos/bolsas-para-ecommerce" },
];

const swatchBg = (id: string, hex: string) =>
  id === "cristal" ? "linear-gradient(135deg,#ffffffaa,#cfe3f340)" : id === "oro" ? "linear-gradient(135deg,#f4d77d,#a77b23)" : id === "plata" ? "linear-gradient(135deg,#f1f2f4,#8e939b)" : hex;

export function Customizer() {
  const params = useSearchParams();
  const initialModel = (models.find((m) => m.id === params.get("modelo"))?.id ?? "rinon") as BagModel;
  const [model, setModel] = useState<BagModel>(initialModel);
  const modelDef = models.find((m) => m.id === model)!;
  const paramBag = params.get("bolsa") as BagColorId | null;
  const [bag, setBag] = useState<BagColorId>(paramBag && modelDef.colors.includes(paramBag) ? paramBag : modelDef.colors[0]);
  const [ink, setInk] = useState(inkColors.find((c) => c.id === params.get("tinta"))?.id ?? (bag === "negro" || bag === "rosa" ? "blanco" : "negro"));
  const [original, setOriginal] = useState(false);
  const [removeWhite, setRemoveWhite] = useState(true);
  const [logo, setLogo] = useState<LoadedLogo | null>(null);
  const [processed, setProcessed] = useState<ProcessedLogo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(0.7);
  const [pos, setPos] = useState({ x: 0.5, y: 0.4 });
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const area = printArea[model];
  const inkHex = inkColors.find((c) => c.id === ink)?.hex ?? "#111";
  const inkName = inkColors.find((c) => c.id === ink)?.name ?? ink;
  const bagName = bagColors.find((b) => b.id === bag)?.name ?? bag;

  // Si cambia el modelo y el color no existe para ese modelo, elegimos el primero disponible.
  useEffect(() => {
    if (!modelDef.colors.includes(bag)) setBag(modelDef.colors[0]);
  }, [modelDef, bag]);

  // Reprocesar el logo cuando cambia el color de impresión o las opciones.
  useEffect(() => {
    if (!logo) return;
    const id = requestAnimationFrame(() => {
      try {
        setProcessed(processLogo(logo.img, { removeWhite, tint: original ? null : inkHex }));
      } catch {
        setError("No pudimos procesar la imagen. Probá con otro archivo.");
      }
    });
    return () => cancelAnimationFrame(id);
  }, [logo, inkHex, original, removeWhite]);

  const handleFile = useCallback(async (file?: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const l = await loadLogoFile(file);
      setLogo(l);
      setPos({ x: 0.5, y: text ? 0.38 : 0.45 });
      setScale(0.7);
      if (window.innerWidth < 1024) {
        requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el logo");
    }
  }, [text]);

  // Dimensiones del logo dentro del área imprimible
  const box = useMemo(() => {
    const ratio = processed ? processed.height / processed.width : 0.6;
    let w = area.w * scale;
    let h = w * ratio;
    const maxH = area.h * (text ? 0.68 : 0.88) * scale;
    if (h > maxH) {
      h = maxH;
      w = h / ratio;
    }
    const cx = area.x + area.w * pos.x;
    const cy = area.y + area.h * pos.y;
    return { w, h, x: cx - w / 2, y: cy - h / 2 };
  }, [processed, area, scale, pos, text]);

  const clampPos = (x: number, y: number) => ({ x: Math.min(0.95, Math.max(0.05, x)), y: Math.min(0.95, Math.max(0.05, y)) });

  function toSvgPoint(e: React.PointerEvent) {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }

  function onPointerDown(e: React.PointerEvent<SVGGElement>) {
    const p = toSvgPoint(e);
    dragRef.current = { dx: p.x - (box.x + box.w / 2), dy: p.y - (box.y + box.h / 2) };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<SVGGElement>) {
    if (!dragRef.current) return;
    const p = toSvgPoint(e);
    setPos(clampPos((p.x - dragRef.current.dx - area.x) / area.w, (p.y - dragRef.current.dy - area.y) / area.h));
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 0.05 : 0.015;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (map[e.key]) {
      e.preventDefault();
      setPos((p) => clampPos(p.x + map[e.key][0], p.y + map[e.key][1]));
    } else if (e.key === "+" || e.key === "=") setScale((s) => Math.min(1, s + 0.05));
    else if (e.key === "-") setScale((s) => Math.max(0.2, s - 0.05));
  }

  async function download() {
    if (!svgRef.current) return;
    setBusy(true);
    try {
      const blob = await svgToPng(svgRef.current);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mi-bolsa-visualgraf-${model}-${bag}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch {
      setError("No se pudo descargar la imagen. Probá con otro navegador.");
    } finally {
      setBusy(false);
    }
  }

  const waMsg = `¡Hola Visual Graf! Probé mi logo en el simulador y quiero cotizar: bolsa ${modelDef.name}, color ${bagName}, impresión ${original ? "a color (consultar)" : inkName}${text ? `, con el texto "${text}"` : ""}. Les adjunto la imagen de la simulación y mi logo.`;
  const textY = Math.min(area.y + area.h - 12, box.y + box.h + 34);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-x-12">
      {/* Paso 1 (en celular va arriba de la vista previa) */}
      <div className="lg:col-start-2 lg:row-start-1">
        <section aria-labelledby="paso1">
            <h2 id="paso1" className="mb-3 font-display text-lg font-extrabold"><span className="text-gradient">1.</span> Subí tu logo</h2>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`ring-rainbow flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl px-6 py-8 text-center transition ${dragOver ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/[0.06]"}`}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
                <IconUpload width={26} height={26} />
              </span>
              <span className="font-display font-bold">{logo ? `Cambiar logo (${logo.name})` : "Elegí tu logo o arrastralo acá"}</span>
              <span className="text-sm text-mute">PNG, JPG, WEBP o SVG · hasta 8 MB · ideal con fondo blanco o transparente</span>
              <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
            <p className="mt-2 text-xs text-mute">Tu imagen se procesa en tu dispositivo, no la subimos a ningún servidor.</p>
            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-brand-magenta/50 bg-brand-magenta/10 px-4 py-3 text-sm">
                {error}
              </p>
            )}
          </section>

      </div>

      {/* Vista previa */}
      <div ref={previewRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
        <div className="noise relative isolate overflow-hidden rounded-[2rem] border border-line p-4 sm:p-8" style={{ background: "radial-gradient(120% 80% at 50% 0%, #26246a 0%, #120f2b 55%, #0a0a14 100%)" }}>
          <div className="glow top-10 -left-10 h-60 w-60 bg-brand-violet opacity-40" aria-hidden />
          <div className="glow -right-10 bottom-0 h-60 w-60 bg-brand-magenta opacity-30" aria-hidden />
          <BagMockup
            id="sim"
            model={model}
            color={bag}
            svgRef={svgRef}
            className="relative mx-auto h-auto w-full max-w-[30rem] drop-shadow-[0_40px_50px_rgba(0,0,0,.55)]"
            title={`Simulación: bolsa ${modelDef.name} color ${bagName} con impresión ${original ? "a color" : inkName}`}
          >
            {processed ? (
              <g
                tabIndex={0}
                role="slider"
                aria-label="Logo en la bolsa. Usá las flechas para moverlo y + o - para cambiar el tamaño"
                aria-valuenow={Math.round(scale * 100)}
                aria-valuemin={20}
                aria-valuemax={100}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                style={{ cursor: "grab", touchAction: "none", outline: "none" }}
                className="focus-visible:[&>rect]:opacity-100"
              >
                <image href={processed.url} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid meet" opacity={0.96} />
                <rect data-ui x={box.x - 4} y={box.y - 4} width={box.w + 8} height={box.h + 8} fill="none" stroke="#34d3f3" strokeDasharray="6 5" strokeWidth="1.5" rx="6" opacity="0" />
              </g>
            ) : (
              <g fill={original ? "#9aa0b4" : inkHex} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900">
                <text x={area.x + area.w / 2} y={area.y + area.h * 0.42} fontSize="46" letterSpacing="-1">TU LOGO</text>
                <text x={area.x + area.w / 2} y={area.y + area.h * 0.42 + 50} fontSize="46" letterSpacing="-1">AQUÍ</text>
              </g>
            )}
            {text && (
              <text x={area.x + area.w / 2} y={textY} textAnchor="middle" fill={original ? "#111" : inkHex} fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize={model === "hielo" ? 15 : 18} letterSpacing="1">
                {text}
              </text>
            )}
          </BagMockup>
          {processed && <p className="relative mt-2 text-center text-xs text-white/60">Arrastrá el logo para moverlo · Simulación ilustrativa</p>}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={download} disabled={busy} className="btn btn-ghost">
            <IconDownload /> {busy ? "Generando…" : "Descargar imagen"}
          </button>
          <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <IconWhatsApp /> Pedir presupuesto
          </a>
          <Link href={`${modelDef.product}`} className="btn btn-primary sm:col-span-2">
            <IconBag /> Elegir medida y comprar
          </Link>
        </div>
      </div>

      {/* Controles */}
      <div className="space-y-8 lg:col-start-2 lg:row-start-2">
        <section aria-labelledby="paso2">
          <h2 id="paso2" className="mb-3 font-display text-lg font-extrabold"><span className="text-gradient">2.</span> Elegí la bolsa</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Modelo de bolsa">
            {models.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={model === m.id} onClick={() => setModel(m.id)} className={`rounded-2xl border px-2 py-3 text-sm font-bold transition ${model === m.id ? "border-white bg-white/10" : "border-line hover:border-white/40"}`}>
                {m.name}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Color de bolsa">
            {modelDef.colors.map((id) => {
              const c = bagColors.find((b) => b.id === id)!;
              return (
                <button key={id} type="button" role="radio" aria-checked={bag === id} onClick={() => setBag(id)} className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${bag === id ? "border-white bg-white/10" : "border-line hover:border-white/40"}`}>
                  <span className="h-5 w-5 rounded-full border border-white/30" style={{ background: swatchBg(id, c.hex) }} aria-hidden />
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="paso3">
          <h2 id="paso3" className="mb-3 font-display text-lg font-extrabold"><span className="text-gradient">3.</span> Color de impresión</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color de impresión">
            {inkColors.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={!original && ink === c.id}
                aria-label={c.name}
                title={c.name}
                onClick={() => {
                  setOriginal(false);
                  setInk(c.id);
                }}
                className={`h-11 w-11 rounded-full border-2 transition ${!original && ink === c.id ? "scale-110 border-white" : "border-white/20 hover:scale-105"}`}
                style={{ background: swatchBg(c.id, c.hex) }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-mute" aria-live="polite">
            {original ? "Mostrando los colores originales de tu logo (impresión multicolor: consultar)." : `Impresión 1 color: ${inkName}.`}
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={original} onChange={(e) => setOriginal(e.target.checked)} className="h-5 w-5 accent-[#ff2e93]" />
              Ver con los colores originales de mi logo
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={removeWhite} onChange={(e) => setRemoveWhite(e.target.checked)} className="h-5 w-5 accent-[#ff2e93]" />
              Quitar fondo blanco del logo
            </label>
          </div>
        </section>

        <section aria-labelledby="paso4">
          <h2 id="paso4" className="mb-3 font-display text-lg font-extrabold"><span className="text-gradient">4.</span> Ajustá el diseño</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="tam" className="label">Tamaño del logo</label>
              <input id="tam" type="range" min={0.2} max={1} step={0.01} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[#34d3f3]" disabled={!processed} />
            </div>
            <div>
              <label htmlFor="posy" className="label">Altura</label>
              <input id="posy" type="range" min={0.05} max={0.95} step={0.01} value={pos.y} onChange={(e) => setPos((p) => ({ ...p, y: Number(e.target.value) }))} className="w-full accent-[#34d3f3]" disabled={!processed} />
            </div>
            <button type="button" className="text-sm font-semibold text-brand-cyan underline-offset-4 hover:underline disabled:opacity-40" disabled={!processed} onClick={() => setPos({ x: 0.5, y: text ? 0.38 : 0.45 })}>
              Centrar logo
            </button>
            <div>
              <label htmlFor="texto" className="label">Texto debajo (opcional)</label>
              <input id="texto" className="field" maxLength={40} placeholder="@tuemprendimiento · 336 000-0000" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
          </div>
        </section>

        <p className="rounded-2xl border border-line bg-white/[0.03] p-4 text-sm text-mute">
          La simulación es ilustrativa. Antes de imprimir te enviamos la prueba de diseño para que la apruebes.
        </p>
      </div>
    </div>
  );
}
