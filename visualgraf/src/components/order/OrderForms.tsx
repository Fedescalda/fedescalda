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

export function ApproveProof({ approve, changes }: { approve: () => Promise<CustomerActionResult>; changes: A }) {
  const [aState, aSubmit, aPending] = useActionState(async () => approve(), {});
  const [cState, cSubmit, cPending] = useActionState(changes, {});
  const [showChanges, setShowChanges] = useState(false);
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={aSubmit}>
          <button className="btn btn-primary w-full" disabled={aPending}>
            <IconCheck /> {aPending ? "Aprobando…" : "Aprobar diseño"}
          </button>
        </form>
        <button type="button" className="btn btn-ghost" onClick={() => setShowChanges((v) => !v)} aria-expanded={showChanges}>
          Pedir cambios
        </button>
      </div>
      <Msg s={aState} />
      {showChanges && (
        <form action={cSubmit} className="mt-4 space-y-3">
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
