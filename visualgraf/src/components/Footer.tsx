"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav, site, waLink } from "@/lib/site";
import { Logo } from "./Logo";
import { IconInstagram, IconMail, IconPin, IconWhatsApp } from "./Icons";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  const year = new Date().getFullYear();
  const ig = site.instagram.replace(/^@/, "");

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line bg-ink-2">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "var(--rainbow)" }} aria-hidden />
      <div className="container-vg grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm text-mute">
            Bolsas personalizadas para comercios y emprendimientos. Tu marca, en cada bolsa, con envíos a toda la Argentina.
          </p>
          <a href={waLink("¡Hola! Quiero pedir un presupuesto.")} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
            <IconWhatsApp /> Cotizá por WhatsApp
          </a>
        </div>

        <nav aria-label="Secciones">
          <h2 className="eyebrow mb-4">Secciones</h2>
          <ul className="space-y-2.5">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-sm text-white/80 transition hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow mb-4">Contacto</h2>
          <ul className="space-y-3 text-sm text-white/80">
            <li>
              <a className="inline-flex items-center gap-2 hover:text-white" href={waLink()} target="_blank" rel="noopener noreferrer">
                <IconWhatsApp width={18} height={18} /> {site.whatsappDisplay}
              </a>
            </li>
            {site.email && (
              <li>
                <a className="inline-flex items-center gap-2 hover:text-white" href={`mailto:${site.email}`}>
                  <IconMail width={18} height={18} /> {site.email}
                </a>
              </li>
            )}
            {ig && (
              <li>
                <a className="inline-flex items-center gap-2 hover:text-white" href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer">
                  <IconInstagram width={18} height={18} /> @{ig}
                </a>
              </li>
            )}
            <li className="inline-flex items-center gap-2">
              <IconPin width={18} height={18} /> {site.city ? `${site.city} · ` : ""}Envíos a todo el país
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-vg flex flex-col gap-2 py-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p suppressHydrationWarning>© {year} Visual Graf · Tu bolsa impresa. Todos los derechos reservados.</p>
          <p>Bolsas · Packaging · Impresión</p>
        </div>
      </div>
    </footer>
  );
}
