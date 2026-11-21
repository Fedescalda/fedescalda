"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";
import { Logo } from "./Logo";
import { IconBag, IconClose, IconMenu } from "./Icons";
import { useCart } from "./cart/CartProvider";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "border-b border-line bg-ink/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-ink">
        Saltar al contenido
      </a>
      <div className="container-vg flex h-16 items-center justify-between gap-4 md:h-20">
        <Logo />

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.slice(1).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isActive(item.href) ? "text-white" : "text-mute hover:text-white"
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full" style={{ background: "var(--rainbow)" }} />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/carrito" className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-white/5 transition hover:bg-white/10" aria-label={`Ver pedido (${count} ${count === 1 ? "producto" : "productos"})`}>
            <IconBag />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-magenta px-1 text-[0.7rem] font-bold">{count}</span>
            )}
          </Link>
          <Link href="/personalizar" className="btn btn-primary hidden !min-h-11 !py-2.5 text-sm md:inline-flex">
            Probá tu logo
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white/5 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div
        id="menu-movil"
        className={`fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-ink/98 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav aria-label="Menú móvil" className="container-vg py-8">
          <ul className="space-y-1">
            {nav.map((item, i) => (
              <li key={item.href} style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }} className={`transition-all duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                <Link
                  href={item.href}
                  tabIndex={open ? 0 : -1}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center justify-between rounded-2xl px-4 py-4 font-display text-2xl font-extrabold ${isActive(item.href) ? "bg-white/5 text-white" : "text-white/80"}`}
                >
                  {item.label}
                  {isActive(item.href) && <span className="h-2 w-2 rounded-full bg-brand-magenta" />}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/personalizar" tabIndex={open ? 0 : -1} className="btn btn-primary mt-8 w-full">
            Probá tu logo en una bolsa
          </Link>
        </nav>
      </div>
    </header>
  );
}
