"use client";

import React, { type FormEvent } from "react";

type Feedback = { status: "idle" | "sending" | "ok" | "error"; message?: string };

export function NewsletterForm({ variant, source }: { variant: "footer" | "card" | "inline"; source: string }) {
  const [feedback, setFeedback] = React.useState<Feedback>({ status: "idle" });
  const sending = feedback.status === "sending";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setFeedback({ status: "sending", message: "Guardando tu suscripción…" });

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: data.get("name") ?? undefined,
          source,
          website: data.get("website"),
        }),
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        form.reset();
        setFeedback({ status: "ok", message: result.message });
      } else {
        setFeedback({ status: "error", message: result.message || "No pudimos guardar tu suscripción." });
      }
    } catch {
      setFeedback({ status: "error", message: "No pudimos guardar tu suscripción. Probá de nuevo." });
    }
  }

  return (
    <form aria-label="Suscripción al newsletter" method="post" onSubmit={submit} className={variant === "card" ? "card space-y-4 p-5 sm:p-6" : "space-y-3"}>
      {variant === "card" && (
        <div>
          <h2 className="text-xl font-bold">Novedades, promos y fechas clave para tu negocio</h2>
          <p className="mt-1 text-sm text-mute">Sin spam. Te mandamos 1 o 2 mails por mes.</p>
        </div>
      )}
      <fieldset disabled={sending} className="min-w-0 space-y-3">
        <div className={variant === "footer" ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
          <label className="grid gap-1 text-sm">
            Email
            <input name="email" type="email" autoComplete="email" maxLength={254} required className="field w-full" />
          </label>
          {variant === "card" && (
            <label className="grid gap-1 text-sm">
              Nombre (opcional)
              <input name="name" autoComplete="given-name" maxLength={80} className="field w-full" />
            </label>
          )}
        </div>
        <label className="flex items-start gap-2 text-sm text-mute">
          <input name="consent" type="checkbox" required className="mt-1 shrink-0" />
          <span>Acepto recibir novedades y promociones de Visual Graf. Me doy de baja cuando quiera.</span>
        </label>
        <div hidden>
          <label>Sitio web <input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <button className="btn btn-primary w-full sm:w-auto">{sending ? "Enviando…" : "Suscribirme"}</button>
      </fieldset>
      <p aria-live="polite" className="text-sm text-mute">{feedback.message}</p>
    </form>
  );
}
