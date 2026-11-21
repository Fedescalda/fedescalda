import Link from "next/link";
import { signOut } from "../actions";
import { getPanelClient } from "../session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const links = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/consultas", label: "Consultas" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/promociones", label: "Promociones" },
  { href: "/admin/configuracion", label: "Configuración" },
  { href: "/", label: "Ver sitio" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return <Link href="/admin/login" className="btn btn-primary">Configurá el panel</Link>;
  }

  if (!await getPanelClient()) {
    return (
      <section className="card space-y-4 p-6">
        <h1 className="text-2xl font-bold">No tenés permisos</h1>
        <form action={signOut}><button className="btn btn-ghost">Salir</button></form>
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="card min-w-0 self-start bg-ink-2 p-4">
        <p className="eyebrow mb-3">Administración</p>
        <nav aria-label="Administración" className="flex gap-2 overflow-x-auto p-1 lg:flex-col">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="btn btn-ghost shrink-0 lg:justify-start">{label}</Link>
          ))}
          <form action={signOut} className="shrink-0">
            <button className="btn btn-ghost lg:w-full lg:justify-start">Salir</button>
          </form>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
