"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setError("");
    setPending(true);

    try {
      const supabase = createBrowserSupabase();
      if (!supabase) {
        setError("Falta configurar Supabase.");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: String(fields.get("email")).trim(),
        password: String(fields.get("password")),
      });
      if (error) {
        setError(error.code === "invalid_credentials"
          ? "Revisá el correo electrónico y la contraseña."
          : "No pudimos iniciar sesión. Intentá de nuevo en unos minutos.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("No pudimos conectarnos. Intentá de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form method="post" onSubmit={signIn} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="username" className="field" required />
      </div>
      <div>
        <label htmlFor="password" className="label">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="field" required />
      </div>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Ingresando…" : "Ingresá"}</button>
    </form>
  );
}
