import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { IconFacebook, IconInstagram, IconMail, IconTruck, IconWhatsApp } from "@/components/Icons";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos por WhatsApp al +54 9 3364 62-2890 o dejanos tu consulta. Bolsas personalizadas con envíos a toda la Argentina.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <>
      <PageHeader eyebrow="Contacto" title="Hablemos de" highlight="tu proyecto." text="Contanos qué vendés y cómo entregás tus productos. Te ayudamos con la medida, el formato y la impresión para tu negocio." />
      <div className="container-vg grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <aside className="space-y-4">
          <a href={waLink("¡Hola Visual Graf! Quiero hacer una consulta.")} target="_blank" rel="noopener noreferrer" className="card group flex items-center gap-4 p-6 transition hover:border-whatsapp/60">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-whatsapp text-[#04210f]">
              <IconWhatsApp width={28} height={28} />
            </span>
            <span>
              <span className="block font-display text-lg font-extrabold">WhatsApp</span>
              <span className="text-white/80">{site.whatsappDisplay}</span>
              <span className="block text-xs text-mute">La forma más rápida de cotizar</span>
            </span>
          </a>
          <a href={`mailto:${site.email}`} className="card flex items-center gap-4 p-6 transition hover:border-white/30">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10"><IconMail width={26} height={26} /></span>
            <span>
              <span className="block font-display text-lg font-extrabold">Email</span>
              <span className="break-all text-white/80">{site.email}</span>
            </span>
          </a>
          <div className="card flex flex-wrap gap-3 p-6">
            <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-11 flex-1 text-sm">
              <IconInstagram /> Instagram
            </a>
            <a href={`https://facebook.com/${site.facebook}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !min-h-11 flex-1 text-sm">
              <IconFacebook /> Facebook
            </a>
          </div>
          <div className="card flex items-center gap-4 p-6">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10"><IconTruck width={26} height={26} /></span>
            <span>
              <span className="block font-display text-lg font-extrabold">Envíos a todo el país</span>
              <span className="text-sm text-mute">Comprá estés donde estés. Coordinamos el envío a tu localidad.</span>
            </span>
          </div>
        </aside>
        <ContactForm />
      </div>
    </>
  );
}
