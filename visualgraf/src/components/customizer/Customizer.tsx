"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BagMockup, printArea, type BagModel } from "../BagMockup";
import { computeLayout, type ContactKey, type FontDef } from "./layout";
import { PrintContent } from "./PrintContent";
import { RealisticMockup, type BagSpec } from "./RealisticMockup";
import { svgToImage, type BagTexture } from "@/lib/bag-render";
import { renderMuestra } from "@/lib/muestra";
import { bagColors, inkColors, type BagColorId } from "@/lib/catalog";
import { ACCEPTED, analyzeLogo, loadLogoFile, processLogo, svgToPng, type LoadedLogo, type LogoAnalysis, type ProcessedLogo } from "@/lib/logo-processing";
import { blobToDataUrl, saveDesign, type DesignMeta } from "@/lib/design-store";
import { waLink } from "@/lib/site";
import { IconBag, IconDownload, IconUpload, IconWhatsApp } from "../Icons";

/* ───────── Modelos, medidas reales y área imprimible aproximada ───────── */

type Size = { label: string; w: number; h: number; variant?: number };
type ModelDef = { id: BagModel; name: string; colors: BagColorId[]; product: string; sizes: Size[]; printRatio: [number, number]; sizeNote?: string };

const models: ModelDef[] = [
  {
    id: "rinon",
    name: "Manija riñón",
    colors: ["blanco", "negro", "cristal", "lila"],
    product: "/productos/bolsa-manija-rinon-personalizada",
    // índice = posición de la medida en el producto (para preseleccionarla)
    sizes: [
      { label: "20 × 30 cm", w: 20, h: 30, variant: 0 },
      { label: "25 × 35 cm", w: 25, h: 35, variant: 1 },
      { label: "30 × 40 cm", w: 30, h: 40, variant: 2 },
      { label: "35 × 45 cm", w: 35, h: 45, variant: 3 },
      { label: "40 × 50 cm", w: 40, h: 50, variant: 4 },
    ],
    printRatio: [0.68, 0.71], // ej. 25×35 → área ≈ 17 × 25 cm
  },
  {
    id: "hielo",
    name: "Para hielo",
    colors: ["cristal", "blanco"],
    product: "/productos/pack-bolsas-para-hielo-personalizadas",
    sizes: [
      { label: "26 × 40 cm", w: 26, h: 40 },
      { label: "28 × 50 cm", w: 28, h: 50 },
      { label: "26 × 50 cm (manija riñón)", w: 26, h: 50 },
      { label: "35 × 75 cm", w: 35, h: 75 },
    ],
    printRatio: [0.78, 0.6],
  },
  {
    id: "ecommerce",
    name: "Ecommerce",
    colors: ["rosa", "negro"],
    product: "/productos/bolsas-para-ecommerce",
    sizes: [{ label: "Medida a confirmar (vista aprox. 30 × 40 cm)", w: 30, h: 40 }],
    printRatio: [0.8, 0.72],
    sizeNote: "Las medidas de ecommerce se confirman al cotizar.",
  },
];

const fonts: FontDef[] = [
  { id: "moderna", name: "Moderna", family: "'Arial Black', Arial, Helvetica, sans-serif", weight: 800 },
  { id: "clasica", name: "Clásica", family: "Georgia, 'Times New Roman', serif", weight: 700 },
  { id: "simple", name: "Simple", family: "Verdana, Tahoma, Arial, sans-serif", weight: 400 },
];

const contactFields: { key: ContactKey; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "@tuemprendimiento" },
  { key: "whatsapp", label: "WhatsApp / teléfono", placeholder: "336 000-0000" },
  { key: "web", label: "Web", placeholder: "www.tumarca.com.ar" },
  { key: "address", label: "Dirección", placeholder: "Belgrano 1234, Rosario" },
];

const swatchBg = (id: string, hex: string) =>
  id === "cristal" ? "linear-gradient(135deg,#ffffffaa,#cfe3f340)" : id === "oro" ? "linear-gradient(135deg,#f4d77d,#a77b23)" : id === "plata" ? "linear-gradient(135deg,#f1f2f4,#8e939b)" : hex;

const cm = (v: number) => v.toLocaleString("es-AR", { maximumFractionDigits: 1 });

export function Customizer() {
  const params = useSearchParams();
  const router = useRouter();
  const initialModel = (models.find((m) => m.id === params.get("modelo"))?.id ?? "rinon") as BagModel;
  const [model, setModel] = useState<BagModel>(initialModel);
  const modelDef = models.find((m) => m.id === model)!;
  const paramBag = params.get("bolsa") as BagColorId | null;
  const [bag, setBag] = useState<BagColorId>(paramBag && modelDef.colors.includes(paramBag) ? paramBag : modelDef.colors[0]);
  const [ink, setInk] = useState(inkColors.find((c) => c.id === params.get("tinta"))?.id ?? (bag === "negro" || bag === "rosa" ? "blanco" : "negro"));
  const [sizeIdx, setSizeIdx] = useState(model === "rinon" ? 1 : 0);
  const [view, setView] = useState<"realista" | "ilustracion">("realista");
  const [brand, setBrand] = useState("");
  const [muestraUrl, setMuestraUrl] = useState<string | null>(null);
  const [original, setOriginal] = useState(false);
  const [removeWhite, setRemoveWhite] = useState(true);
  const [logo, setLogo] = useState<LoadedLogo | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<LogoAnalysis | null>(null);
  const [processed, setProcessed] = useState<ProcessedLogo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(0.75);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0.5, y: 0.4 });
  const [slogan, setSlogan] = useState("");
  const [contact, setContact] = useState<Record<ContactKey, string>>({ instagram: "", whatsapp: "", web: "", address: "" });
  const [fontId, setFontId] = useState(fonts[0].id);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const printSvgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const size = modelDef.sizes[Math.min(sizeIdx, modelDef.sizes.length - 1)];
  const printW = size.w * modelDef.printRatio[0];
  const printH = size.h * modelDef.printRatio[1];
  const inkHex = inkColors.find((c) => c.id === ink)?.hex ?? "#111";
  const inkName = inkColors.find((c) => c.id === ink)?.name ?? ink;
  const bagName = bagColors.find((b) => b.id === bag)?.name ?? bag;
  const font = fonts.find((f) => f.id === fontId)!;
  const printColor = original ? (bag === "negro" ? "#ffffff" : "#111111") : inkHex;
  const spec: BagSpec = useMemo(
    () => ({
      shape: model === "rinon" ? "rinon" : model === "ecommerce" ? "ecommerce" : /riñón/.test(size.label) ? "hielo-rinon" : "hielo",
      texture: bag as BagTexture,
      wCm: size.w,
      hCm: size.h,
    }),
    [model, bag, size],
  );
  const realistic = view === "realista";

  useEffect(() => {
    if (!modelDef.colors.includes(bag)) setBag(modelDef.colors[0]);
    if (sizeIdx >= modelDef.sizes.length) setSizeIdx(0);
  }, [modelDef, bag, sizeIdx]);

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
      setLogoFile(file);
      setAnalysis(analyzeLogo(l.img, file.type === "image/svg+xml"));
      setPos({ x: 0.5, y: 0.4 });
      setScale(0.75);
      setRotation(0);
      if (window.innerWidth < 1024) requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el logo");
    }
  }, []);

  /* Diagramación en cm (igual para foto e ilustración) */
  const contactLines = contactFields.filter((f) => contact[f.key].trim()).map((f) => ({ key: f.key, text: contact[f.key].trim() }));
  const layout = useMemo(
    () =>
      computeLayout({
        printW,
        printH,
        logoRatio: processed ? processed.height / processed.width : null,
        scale,
        pos,
        slogan,
        contact: contactLines,
        font,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contactLines se deriva de contact
    [printW, printH, processed, scale, pos, slogan, contact, font],
  );
  const logoCm = layout.logo ? { w: layout.logo.w, h: layout.logo.h } : null;
  const dpi = analysis && logoCm && !analysis.vector ? Math.round(analysis.width / (logoCm.w / 2.54)) : null;
  const quality = !analysis ? null : analysis.vector ? "vector" : dpi! >= 200 ? "buena" : dpi! >= 120 ? "aceptable" : "baja";

  /* Ubicación del área en la ilustración SVG */
  const area = printArea[model];
  const svgS = Math.min(area.w / printW, area.h / printH);
  const svgO = { x: area.x + (area.w - printW * svgS) / 2, y: area.y + (area.h - printH * svgS) / 2 };

  const clampPos = (x: number, y: number) => ({ x: Math.min(0.97, Math.max(0.03, x)), y: Math.min(0.97, Math.max(0.03, y)) });

  /** Arrastre común: punto en cm dentro del área */
  function startDrag(cx: number, cy: number) {
    const l = layout.logo;
    if (!l) return false;
    if (cx < l.x - 1 || cx > l.x + l.w + 1 || cy < l.y - 1 || cy > l.y + l.h + 1) return false;
    dragRef.current = { dx: cx - (l.x + l.w / 2), dy: cy - (l.y + l.h / 2) };
    return true;
  }
  function moveDrag(cx: number, cy: number) {
    if (!dragRef.current) return;
    setPos(clampPos((cx - dragRef.current.dx) / printW, (cy - dragRef.current.dy) / printH));
  }
  const endDrag = () => (dragRef.current = null);

  function svgPointToCm(e: React.PointerEvent) {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const u = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return [(u.x - svgO.x) / svgS, (u.y - svgO.y) / svgS] as const;
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

  /** PNG de la vista actual (foto real o ilustración). */
  async function renderPng(width = 1200): Promise<Blob> {
    if (realistic && canvasRef.current) {
      const c = canvasRef.current;
      const out = document.createElement("canvas");
      out.width = c.width;
      out.height = c.height;
      const x = out.getContext("2d")!;
      x.drawImage(c, 0, 0);
      x.fillStyle = "rgba(255,255,255,.75)";
      x.font = `600 ${Math.round(c.width / 40)}px Arial, sans-serif`;
      x.textAlign = "center";
      x.fillText("Simulación · Visual Graf", c.width / 2, c.height - c.width / 40);
      return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("png"))), "image/png"));
    }
    return svgToPng(svgRef.current!, width);
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await renderPng();
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

  /** Genera la "Muestra digital" (JPG) con el estilo de Visual Graf. */
  async function buildMuestra() {
    const ink = printSvgRef.current ? await svgToImage(printSvgRef.current) : null;
    const canvas = await renderMuestra({
      title: brand.trim() || "Tu marca",
      printCm: logoCm ? { w: Math.round(logoCm.w * 100) / 100, h: Math.round(logoCm.h * 100) / 100 } : null,
      bags: [{ ...spec, ink }],
      tipo: model === "rinon" ? "Bolsa manija riñón" : model === "hielo" ? "Bolsa de hielo" : "Bolsa ecommerce",
      material: bagName,
      impresion: original ? "Multicolor" : inkName,
      medidas: size.label.replace(/\s*\(.*\)/, "").replace(/\s/g, " "),
      web: "www.vgtubolsaimpresa.store",
    });
    return canvas.toDataURL("image/jpeg", 0.88);
  }

  async function showMuestra() {
    setBusy(true);
    try {
      setMuestraUrl(await buildMuestra());
    } catch {
      setError("No pudimos generar la muestra. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  function designMeta(): DesignMeta {
    return {
      model: modelDef.name,
      size: size.label,
      bagColor: bagName,
      ink: original ? "Colores originales (multicolor)" : inkName,
      multicolor: original,
      logoCm: logoCm ? { w: Math.round(logoCm.w * 10) / 10, h: Math.round(logoCm.h * 10) / 10 } : null,
      rotation,
      contact: [slogan, ...contactLines.map((l) => l.text)].filter(Boolean),
      font: font.name,
      quality: analysis ? { dpi, colors: analysis.colors, gradient: analysis.gradient } : undefined,
    };
  }

  async function addDesignToOrder() {
    setBusy(true);
    try {
      // La muestra digital viaja con el pedido (sirve como base de la prueba de diseño)
      const mockup = await buildMuestra().catch(async () => blobToDataUrl(await renderPng(900)));
      const logoData = logoFile && logoFile.size < 2.5 * 1024 * 1024 ? await blobToDataUrl(logoFile) : undefined;
      const meta = designMeta();
      saveDesign({
        mockup,
        logo: logoData,
        logoName: logoFile?.name,
        summary: `${modelDef.name} ${size.label} · bolsa ${bagName} · impresión ${original ? "multicolor" : inkName}${meta.logoCm ? ` · logo ${cm(meta.logoCm.w)}×${cm(meta.logoCm.h)} cm` : ""}`,
        savedAt: Date.now(),
        meta,
      });
      const medida = size.variant != null ? `&medida=${size.variant}` : "";
      router.push(`${modelDef.product}?bolsa=${bag}&tinta=${original ? "" : ink}&diseno=1${medida}`);
    } catch {
      setError("No pudimos guardar el diseño. Probá descargarlo y subirlo en el pedido.");
      setBusy(false);
    }
  }

  const waMsg = `¡Hola Visual Graf! Probé mi logo en el simulador y quiero cotizar: bolsa ${modelDef.name} ${size.label}, color ${bagName}, impresión ${original ? "multicolor (consultar)" : inkName}${logoCm ? `, logo de ${cm(logoCm.w)} × ${cm(logoCm.h)} cm` : ""}. Les adjunto la imagen de la simulación y mi logo.`;
  const printProps = { layout, logoUrl: processed?.url ?? null, rotation, color: printColor, font };
  const renderVersion = JSON.stringify([bag, model, sizeIdx, layout, processed?.url.length, rotation, printColor, fontId]);

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
            className={`ring-rainbow flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl px-6 py-7 text-center transition ${dragOver ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/[0.06]"}`}
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><IconUpload width={26} height={26} /></span>
            <span className="font-display font-bold">{logo ? `Cambiar logo (${logo.name})` : "Elegí tu logo o arrastralo acá"}</span>
            <span className="text-sm text-mute">PNG, JPG, WEBP o SVG · hasta 8 MB · ideal con fondo blanco o transparente</span>
            <input type="file" accept={ACCEPTED.join(",")} className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          <p className="mt-2 text-xs text-mute">Tu imagen se procesa en tu dispositivo hasta que decidís comprar.</p>
          {error && <p role="alert" className="mt-3 rounded-xl border border-brand-magenta/50 bg-brand-magenta/10 px-4 py-3 text-sm">{error}</p>}

          {analysis && (
            <div className="card mt-4 space-y-2 p-4 text-sm" aria-live="polite">
              <p className="font-display font-bold">Chequeo de tu archivo</p>
              <p>
                {quality === "vector" && <span className="text-brand-green">✓ Archivo vectorial: calidad ideal para imprimir.</span>}
                {quality === "buena" && <span className="text-brand-green">✓ Resolución buena para este tamaño ({dpi} ppp).</span>}
                {quality === "aceptable" && <span className="text-brand-yellow">● Resolución aceptable ({dpi} ppp). Si tenés el logo en mejor calidad (PDF, SVG o PNG grande), mejor.</span>}
                {quality === "baja" && <span className="text-brand-magenta">▲ Resolución baja para este tamaño ({dpi} ppp). Achicá el logo o mandanos un archivo de mejor calidad; igual lo revisamos antes de imprimir.</span>}
              </p>
              <p>
                {analysis.gradient ? (
                  <span className="text-brand-yellow">● Tu logo tiene degradados, sombras o fotos. La serigrafía imprime colores planos: lo adaptamos y te mostramos la prueba.</span>
                ) : analysis.colors <= 1 ? (
                  <span className="text-brand-green">✓ Logo de 1 color: perfecto para serigrafía.</span>
                ) : (
                  <span className="text-white/85">● Detectamos {analysis.colors} colores. El precio incluye 1 color; podés imprimirlo en 1 color (vista actual) o consultarnos por {analysis.colors} colores.</span>
                )}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Vista previa */}
      <div ref={previewRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
        <div className="noise relative isolate overflow-hidden rounded-[2rem] border border-line p-4 sm:p-6" style={{ background: "radial-gradient(120% 80% at 50% 0%, #26246a 0%, #120f2b 55%, #0a0a14 100%)" }}>
          <div className="glow top-10 -left-10 h-60 w-60 bg-brand-violet opacity-40" aria-hidden />
          <div className="glow -right-10 bottom-0 h-60 w-60 bg-brand-magenta opacity-30" aria-hidden />

          <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-white/70">
              {modelDef.name} · {size.label} · área de impresión aprox. {cm(printW)} × {cm(printH)} cm
            </p>
            <div className="flex rounded-full border border-line bg-ink/60 p-1 text-xs font-semibold" role="radiogroup" aria-label="Tipo de vista">
              {(["realista", "ilustracion"] as const).map((v) => (
                <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={`rounded-full px-3 py-1.5 transition ${view === v ? "bg-white text-ink" : "text-white/75 hover:text-white"}`}>
                  {v === "realista" ? "Realista" : "Ilustración"}
                </button>
              ))}
            </div>
          </div>

          {realistic ? (
            <>
              <RealisticMockup
                spec={spec}
                printSvg={printSvgRef}
                version={renderVersion}
                canvasRef={canvasRef}
                rectRef={rectRef}
                interactive={Boolean(processed)}
                label={`Bolsa ${modelDef.name} ${size.label} color ${bagName} con tu diseño impreso en ${original ? "colores originales" : inkName}`}
                onPointerDown={(px, py, e) => {
                  const r = rectRef.current;
                  if (r && startDrag(((px - r.x) / r.w) * printW, ((py - r.y) / r.h) * printH)) e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(px, py) => {
                  const r = rectRef.current;
                  if (r) moveDrag(((px - r.x) / r.w) * printW, ((py - r.y) / r.h) * printH);
                }}
                onPointerUp={endDrag}
                onKeyDown={onKeyDown}
              />
              {/* Capa de impresión en cm (oculta): se "imprime" sobre la bolsa realista */}
              <svg
                ref={printSvgRef}
                aria-hidden
                xmlns="http://www.w3.org/2000/svg"
                width={1400}
                height={Math.round((1400 * printH) / printW)}
                viewBox={`0 0 ${printW} ${printH}`}
                style={{ position: "absolute", left: -99999, top: 0, width: 1, height: 1 }}
              >
                <PrintContent {...printProps} placeholder />
              </svg>
            </>
          ) : (
            <BagMockup
              id="sim"
              model={model}
              color={bag}
              svgRef={svgRef}
              className="relative mx-auto h-auto w-full max-w-[30rem] drop-shadow-[0_40px_50px_rgba(0,0,0,.55)]"
              title={`Ilustración: bolsa ${modelDef.name} ${size.label} color ${bagName} con impresión ${original ? "multicolor" : inkName}`}
            >
              <g
                transform={`translate(${svgO.x} ${svgO.y}) scale(${svgS})`}
                tabIndex={processed ? 0 : -1}
                role="slider"
                aria-label="Diseño en la bolsa. Usá las flechas para mover el logo y + o - para cambiar el tamaño"
                aria-valuenow={Math.round(scale * 100)}
                aria-valuemin={20}
                aria-valuemax={100}
                aria-valuetext={logoCm ? `${cm(logoCm.w)} por ${cm(logoCm.h)} centímetros` : undefined}
                onPointerDown={(e) => {
                  const [cx, cy] = svgPointToCm(e);
                  if (startDrag(cx, cy)) (e.currentTarget as Element).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!dragRef.current) return;
                  const [cx, cy] = svgPointToCm(e);
                  moveDrag(cx, cy);
                }}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={onKeyDown}
                style={{ cursor: processed ? "grab" : "default", touchAction: processed ? "none" : "auto", outline: "none" }}
              >
                <rect x={0} y={0} width={printW} height={printH} fill="transparent" />
                <PrintContent {...printProps} placeholder />
                {/* Cotas (solo en pantalla) */}
                {layout.logo && (
                  <g data-ui pointerEvents="none" fill="#34d3f3" fontFamily="Arial, sans-serif" fontSize={0.55}>
                    <line x1={layout.logo.x} y1={layout.logo.y - 0.4} x2={layout.logo.x + layout.logo.w} y2={layout.logo.y - 0.4} stroke="#34d3f3" strokeWidth={0.05} />
                    <text x={layout.logo.x + layout.logo.w / 2} y={layout.logo.y - 0.6} textAnchor="middle">{cm(layout.logo.w)} cm</text>
                  </g>
                )}
              </g>
            </BagMockup>
          )}
          <p className="relative mt-3 text-center text-xs text-white/60">
            {processed ? "Arrastrá el logo para moverlo · Medidas aproximadas: se confirman en la prueba de diseño" : "Subí tu logo para verlo impreso"}
          </p>
        </div>

        {logoCm && (
          <p className="mt-3 text-center text-sm" aria-live="polite">
            Tu logo medirá aprox. <strong>{cm(logoCm.w)} × {cm(logoCm.h)} cm</strong> en una bolsa de {size.label}.
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={download} disabled={busy} className="btn btn-ghost">
            <IconDownload /> {busy ? "Generando…" : "Descargar imagen"}
          </button>
          <a href={waLink(waMsg)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <IconWhatsApp /> Pedir presupuesto
          </a>
          <button type="button" onClick={showMuestra} disabled={busy || !realistic} className="btn btn-ghost sm:col-span-2" title={realistic ? undefined : "Disponible en la vista realista"}>
            Ver muestra digital
          </button>
          <button type="button" onClick={addDesignToOrder} disabled={busy || !processed} className="btn btn-primary sm:col-span-2">
            <IconBag /> {processed ? "Usar este diseño y comprar" : "Subí tu logo para comprar con este diseño"}
          </button>
          <Link href={modelDef.product} className="text-center text-sm text-mute underline-offset-4 hover:underline sm:col-span-2">
            Prefiero elegir la medida y subir el logo después
          </Link>
        </div>
      </div>

      {/* Controles */}
      <div className="space-y-8 lg:col-start-2 lg:row-start-2">
        <section aria-labelledby="paso2">
          <h2 id="paso2" className="mb-3 font-display text-lg font-extrabold"><span className="text-gradient">2.</span> Elegí la bolsa y la medida</h2>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Modelo de bolsa">
            {models.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={model === m.id} onClick={() => { setModel(m.id); setSizeIdx(m.id === "rinon" ? 1 : 0); }} className={`rounded-2xl border px-2 py-3 text-sm font-bold transition ${model === m.id ? "border-white bg-white/10" : "border-line hover:border-white/40"}`}>
                {m.name}
              </button>
            ))}
          </div>
          <label htmlFor="medida" className="label mt-4">Medida (ancho × alto)</label>
          <select id="medida" className="field" value={sizeIdx} onChange={(e) => setSizeIdx(Number(e.target.value))}>
            {modelDef.sizes.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
          </select>
          {modelDef.sizeNote && <p className="mt-1 text-xs text-mute">{modelDef.sizeNote}</p>}
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
                onClick={() => { setOriginal(false); setInk(c.id); }}
                className={`h-11 w-11 rounded-full border-2 transition ${!original && ink === c.id ? "scale-110 border-white" : "border-white/20 hover:scale-105"}`}
                style={{ background: swatchBg(c.id, c.hex) }}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-mute" aria-live="polite">
            {original ? "Mostrando los colores originales de tu logo (impresión multicolor: se cotiza aparte)." : `Impresión 1 color: ${inkName}.`}
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
          <h2 id="paso4" className="mb-3 font-display text-lg font-extrabold"><span className="text-gradient">4.</span> Ajustá el logo</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="tam" className="label">Tamaño {logoCm && <span className="font-normal text-mute">({cm(logoCm.w)} × {cm(logoCm.h)} cm)</span>}</label>
              <input id="tam" type="range" min={0.2} max={1} step={0.01} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[#34d3f3]" disabled={!processed} />
            </div>
            <div>
              <label htmlFor="posy" className="label">Altura</label>
              <input id="posy" type="range" min={0.03} max={0.97} step={0.01} value={pos.y} onChange={(e) => setPos((p) => ({ ...p, y: Number(e.target.value) }))} className="w-full accent-[#34d3f3]" disabled={!processed} />
            </div>
            <div>
              <label htmlFor="rot" className="label">Rotación <span className="font-normal text-mute">({rotation}°)</span></label>
              <input id="rot" type="range" min={-45} max={45} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-[#34d3f3]" disabled={!processed} />
            </div>
            <button type="button" className="text-sm font-semibold text-brand-cyan underline-offset-4 hover:underline disabled:opacity-40" disabled={!processed} onClick={() => { setPos({ x: 0.5, y: 0.4 }); setRotation(0); }}>
              Centrar y enderezar
            </button>
          </div>
        </section>

        <div>
          <label htmlFor="marca" className="label">Nombre de tu marca <span className="font-normal text-mute">(para la muestra digital)</span></label>
          <input id="marca" className="field" maxLength={40} placeholder="Ej: Hielo Cubitos" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>

        <section aria-labelledby="paso5">
          <h2 id="paso5" className="mb-1 font-display text-lg font-extrabold"><span className="text-gradient">5.</span> Textos y datos de contacto</h2>
          <p className="mb-3 text-sm text-mute">Opcional. Se imprimen abajo, en el mismo color, y se ajustan solos al ancho de la bolsa.</p>
          <div className="space-y-3">
            <div>
              <label htmlFor="slogan" className="label">Frase (opcional)</label>
              <input id="slogan" className="field" maxLength={40} placeholder="Gracias por tu compra" value={slogan} onChange={(e) => setSlogan(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {contactFields.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`c-${f.key}`} className="label">{f.label}</label>
                  <input id={`c-${f.key}`} className="field" maxLength={50} placeholder={f.placeholder} value={contact[f.key]} onChange={(e) => setContact((c) => ({ ...c, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <fieldset>
              <legend className="label">Tipografía de los textos</legend>
              <div className="flex flex-wrap gap-2">
                {fonts.map((f) => (
                  <button key={f.id} type="button" aria-pressed={fontId === f.id} onClick={() => setFontId(f.id)} className={`rounded-full border px-4 py-2 text-sm transition ${fontId === f.id ? "border-white bg-white/10" : "border-line hover:border-white/40"}`} style={{ fontFamily: f.family, fontWeight: f.weight }}>
                    {f.name}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <p className="rounded-2xl border border-line bg-white/[0.03] p-4 text-sm text-mute">
          La simulación es una referencia. Antes de imprimir te enviamos la <strong className="text-white">prueba de diseño final</strong> y solo producimos cuando la aprobás.
        </p>
      </div>
      {muestraUrl && (
        <div role="dialog" aria-modal="true" aria-label="Muestra digital" className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4 backdrop-blur" onClick={() => setMuestraUrl(null)}>
          <div className="max-h-full w-full max-w-xl overflow-auto rounded-2xl bg-ink-2 p-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen generada en el navegador */}
            <img src={muestraUrl} alt="Muestra digital de tu bolsa" className="w-full rounded-xl" />
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <a href={muestraUrl} download={`muestra-digital-${(brand || "visualgraf").toLowerCase().replace(/\W+/g, "-")}.jpg`} className="btn btn-primary">
                <IconDownload /> Descargar muestra
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => setMuestraUrl(null)} autoFocus>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
