import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/cart/ClearCart";
import { IconWhatsApp } from "@/components/Icons";
import { waLink } from "@/lib/site";

export const metadata: Metadata = { title: "Estado del pedido", robots: { index: false } };

const copy = {
  exito: { title: "¡Gracias por tu compra!", text: "Tu pago fue aprobado. Ahora mandanos tu logo por WhatsApp con tu número de pedido para coordinar la impresión.", color: "text-brand-green" },
  pendiente: { title: "Tu pago está pendiente", text: "Mercado Pago está procesando el pago. Te avisamos cuando se acredite. Mientras tanto podés enviarnos tu logo por WhatsApp.", color: "text-brand-yellow" },
  error: { title: "El pago no se completó", text: "No se pudo procesar el pago. Podés intentar de nuevo o coordinar por WhatsApp.", color: "text-brand-magenta" },
} as const;

export default async function PedidoPage({ params, searchParams }: { params: Promise<{ estado: string }>; searchParams: Promise<{ pedido?: string }> }) {
  const { estado } = await params;
  const { pedido } = await searchParams;
  const c = copy[estado as keyof typeof copy];
  if (!c) notFound();
  const id = (pedido ?? "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 8).toUpperCase();

  return (
    <div className="container-vg pt-36 pb-10">
      {estado === "exito" && <ClearCart />}
      <div className="card mx-auto max-w-2xl p-8 text-center md:p-12">
        {id && <p className="eyebrow">Pedido #{id}</p>}
        <h1 className={`mt-3 font-display text-3xl font-black md:text-4xl ${c.color}`}>{c.title}</h1>
        <p className="mt-4 text-white/80">{c.text}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={waLink(`¡Hola Visual Graf! Les escribo por mi pedido${id ? ` #${id}` : ""}. Les envío mi logo.`)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <IconWhatsApp /> Enviar mi logo
          </a>
          {estado === "error" ? <Link href="/carrito" className="btn btn-ghost">Volver al pedido</Link> : <Link href="/" className="btn btn-ghost">Volver al inicio</Link>}
        </div>
      </div>
    </div>
  );
}
