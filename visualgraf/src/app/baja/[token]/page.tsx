import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { unsubscribe, validUnsubscribeToken } from "@/lib/newsletter";

export const metadata: Metadata = {
  title: "Baja del newsletter",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ resultado?: string }>;
}) {
  const { token } = await params;
  const { resultado } = await searchParams;
  const valid = validUnsubscribeToken(token);

  async function confirm() {
    "use server";
    const ok = await unsubscribe(token);
    redirect(`/baja/${encodeURIComponent(token)}?resultado=${ok ? "ok" : "error"}`);
  }

  return (
    <section className="card mx-auto my-12 max-w-lg space-y-4 p-6">
      <h1 className="text-2xl font-bold">Baja del newsletter</h1>
      {!valid ? <p>El enlace de baja no es válido.</p> : resultado === "ok" ? (
        <p role="status">Listo, ya no vas a recibir novedades ni promociones de Visual Graf.</p>
      ) : (
        <form action={confirm} className="space-y-4">
          <p>Confirmá que querés dejar de recibir novedades y promociones de Visual Graf.</p>
          {resultado === "error" && <p role="alert">No pudimos procesar la baja. Probá de nuevo.</p>}
          <button className="btn btn-primary">Confirmar baja</button>
        </form>
      )}
    </section>
  );
}
