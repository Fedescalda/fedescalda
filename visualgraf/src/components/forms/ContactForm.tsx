"use client";
import { useState } from "react";
import { provinces } from "@/lib/validation";
import { waLink } from "@/lib/site";
import { IconCheck, IconWhatsApp } from "../Icons";

type State = { status: "idle" | "sending" | "done" | "error"; stored?: boolean; error?: string; data?: Record<string, string> };

export function ContactForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No pudimos enviar tu consulta");
      setState({ status: "done", stored: json.stored, data });
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err.message : "Error", data });
    }
  }

  const waText = (d?: Record<string, string>) =>
    `¡Hola Visual Graf! Soy ${d?.name ?? ""}${d?.business ? ` de ${d.business}` : ""}${d?.province ? ` (${d.province})` : ""}. ${d?.interest ? `Me interesa: ${d.interest}. ` : ""}${d?.message ?? ""}`;

  if (state.status === "done") {
    return (
      <div className="card p-8 text-center" role="status">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-green/20 text-brand-green">
          <IconCheck width={28} height={28} />
        </span>
        <h2 className="mt-5 font-display text-2xl font-black">{state.stored ? "¡Recibimos tu consulta!" : "¡Casi listo!"}</h2>
        <p className="mt-3 text-white/80">
          {state.stored ? "Te respondemos a la brevedad. Si querés una respuesta más rápida, escribinos por WhatsApp." : "Para que te respondamos más rápido, enviá tu consulta por WhatsApp con un toque."}
        </p>
        <a href={waLink(waText(state.data))} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
          <IconWhatsApp /> {state.stored ? "Escribir por WhatsApp" : "Enviar por WhatsApp"}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-5 p-6 md:grid-cols-2 md:p-8" noValidate={false}>
      <div>
        <label htmlFor="name" className="label">Nombre *</label>
        <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" />
      </div>
      <div>
        <label htmlFor="business" className="label">Negocio o marca</label>
        <input id="business" name="business" maxLength={80} autoComplete="organization" className="field" />
      </div>
      <div>
        <label htmlFor="email" className="label">Email *</label>
        <input id="email" name="email" type="email" required maxLength={120} autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="phone" className="label">WhatsApp / teléfono</label>
        <input id="phone" name="phone" type="tel" maxLength={30} autoComplete="tel" inputMode="tel" className="field" />
      </div>
      <div>
        <label htmlFor="province" className="label">Provincia</label>
        <select id="province" name="province" className="field" defaultValue="">
          <option value="">Elegí tu provincia</option>
          {provinces.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="interest" className="label">Me interesa</label>
        <select id="interest" name="interest" className="field" defaultValue="">
          <option value="">Elegí una opción</option>
          <option>Bolsas manija riñón</option>
          <option>Bolsas para hielo</option>
          <option>Bolsas para ecommerce</option>
          <option>Compra mayorista</option>
          <option>Otra medida o formato</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label htmlFor="message" className="label">Mensaje *</label>
        <textarea id="message" name="message" required minLength={5} maxLength={2000} rows={5} className="field" placeholder="Contanos qué vendés, qué medida y cantidad necesitás…" />
      </div>
      {/* Honeypot anti-spam: oculto para personas */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.status === "error" && (
        <p role="alert" className="rounded-xl border border-brand-magenta/50 bg-brand-magenta/10 px-4 py-3 text-sm md:col-span-2">
          {state.error}. También podés <a className="underline" href={waLink(waText(state.data))} target="_blank" rel="noopener noreferrer">escribirnos por WhatsApp</a>.
        </p>
      )}
      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
        <button type="submit" disabled={state.status === "sending"} className="btn btn-primary">
          {state.status === "sending" ? "Enviando…" : "Enviar consulta"}
        </button>
        <p className="text-xs text-mute">Respondemos de lunes a viernes. Tus datos solo se usan para responderte.</p>
      </div>
    </form>
  );
}
