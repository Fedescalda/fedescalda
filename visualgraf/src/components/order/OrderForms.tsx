"use client";
import { useActionState, useState } from "react";
import type { CustomerActionResult } from "@/app/pedido/[token]/actions";
import { IconCheck, IconUpload } from "../Icons";

type A = (s: CustomerActionResult, f: FormData) => Promise<CustomerActionResult>;

function Msg({ s }: { s: CustomerActionResult }) {
  if (s.error) return <p role="alert" className="mt-3 rounded-xl border border-brand-magenta/50 bg-brand-magenta/10 px-4 py-3 text-sm">{s.error}</p>;
  if (s.success) return <p role="status" className="mt-3 rounded-xl border border-brand-green/50 bg-brand-green/10 px-4 py-3 text-sm">{s.success}</p>;
  return null;
}

export function ApproveProof({ approve, changes, version }: { approve: A; changes: A; version: number }) {
  const [aState, aSubmit, aPending] = useActionState(approve, {});
  const [cState, cSubmit, cPending] = useActionState(changes, {});
  const [showChanges, setShowChanges] = useState(false);
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  return (
    <div>
      <form action={aSubmit} className="space-y-3">
        <input type="hidden" name="version" value={version} />
        <p className="font-semibold">Antes de aprobar, revisá con atención:</p>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="check_texts" checked={c1} onChange={(e) => setC1(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#34d3f3]" />
          <span>Revisé <strong>textos y ortografía</strong>, teléfonos, redes, <strong>colores</strong>, <strong>tamaño y ubicación</strong> del logo.</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="check_print" checked={c2} onChange={(e) => setC2(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#34d3f3]" />
          <span>Entiendo que <strong>se imprime tal cual esta prueba</strong> y que después de aprobarla no se pueden hacer cambios.</span>
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn btn-primary" disabled={aPending || !c1 || !c2}>
            <IconCheck /> {aPending ? "Aprobando…" : "Apruebo el diseño para producción"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowChanges((v) => !v)} aria-expanded={showChanges}>
            Pedir cambios
          </button>
        </div>
      </form>
      <Msg s={aState} />
      {showChanges && (
        <form action={cSubmit} className="mt-4 space-y-3">
          <input type="hidden" name="version" value={version} />
          <label htmlFor="feedback" className="label">¿Qué querés cambiar?</label>
          <textarea id="feedback" name="feedback" required minLength={5} maxLength={1500} rows={3} className="field" placeholder="Ej: el logo más grande, cambiar el color de impresión a dorado…" />
          <button className="btn btn-ghost" disabled={cPending}>{cPending ? "Enviando…" : "Enviar cambios"}</button>
          <Msg s={cState} />
        </form>
      )}
    </div>
  );
}

export function UploadLogo({ action, hasLogo }: { action: A; hasLogo: boolean }) {
  const [state, submit, pending] = useActionState(action, {});
  const [name, setName] = useState("");
  return (
    <form action={submit} className="space-y-3">
      <label className="ring-rainbow flex cursor-pointer flex-col items-center gap-2 rounded-2xl bg-white/[0.03] px-5 py-6 text-center hover:bg-white/[0.06]">
        <IconUpload width={24} height={24} />
        <span className="font-semibold">{name || (hasLogo ? "Subir otra versión de mi logo" : "Elegí el archivo de tu logo")}</span>
        <span className="text-xs text-mute">PNG, JPG, WEBP, SVG o PDF · hasta 4 MB</span>
        <input type="file" name="logo" required accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf" className="sr-only" onChange={(e) => setName(e.target.files?.[0]?.name ?? "")} />
      </label>
      <button className="btn btn-primary" disabled={pending || !name}>{pending ? "Subiendo…" : "Enviar logo"}</button>
      <Msg s={state} />
    </form>
  );
}

export function PayAgain({ action }: { action: () => Promise<CustomerActionResult> }) {
  const [state, submit, pending] = useActionState(async () => action(), {});
  return (
    <form action={submit}>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Abriendo Mercado Pago…" : "Pagar con Mercado Pago"}</button>
      <Msg s={state} />
    </form>
  );
}
