"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { AnimatedNumber } from "./AnimatedNumber";
import { formatARS } from "@/lib/site";
import { IconArrow, IconClose } from "../Icons";

/** Panel lateral (abajo en celular) que confirma lo que se agregó al pedido. */
export function CartDrawer() {
  const { drawerOpen, closeDrawer, lastAdded, items, subtotal } = useCart();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => closeDrawer(), [pathname, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    returnFocus.current = document.activeElement;
    panelRef.current?.querySelector<HTMLElement>("[data-close]")?.focus();
    // bloquea el scroll de la página detrás del panel (sin saltos)
    const { overflow, paddingRight } = document.body.style;
    const sb = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (sb > 0) document.body.style.paddingRight = `${sb}px`;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab" && panelRef.current) {
        const els = [...panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")];
        if (!els.length) return;
        const i = els.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          els[els.length - 1].focus();
        } else if (!e.shiftKey && i === els.length - 1) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      const back = returnFocus.current as HTMLElement | null;
      // el botón que abrió el panel puede haber cambiado: volvemos al carrito si no existe
      if (back && document.contains(back)) back.focus();
      else document.getElementById("cart-button")?.focus();
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen || !lastAdded) return null;
  const units = lastAdded.quantity * lastAdded.packSize;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div aria-hidden className="anim-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
      <div
        ref={panelRef}
        className="anim-drawer absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-ink-2 p-6 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-3xl"
      >
        <div className="flex items-center justify-between">
          <p id="drawer-title" className="flex items-center gap-2 font-display text-lg font-black">
            <span className="anim-check grid h-8 w-8 place-items-center rounded-full bg-brand-green/20 text-brand-green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5 10 17 19 7" />
              </svg>
            </span>
            ¡Agregado a tu pedido!
          </p>
          <button type="button" data-close onClick={closeDrawer} aria-label="Cerrar panel" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
            <IconClose />
          </button>
        </div>

        <div className="anim-item-in mt-5 flex gap-4 rounded-2xl border border-line bg-white/[0.03] p-3" style={{ animationDelay: "120ms" }}>
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-3">
            {lastAdded.image && <Image src={lastAdded.image} alt="" fill sizes="80px" className="object-cover" />}
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-display font-extrabold">{lastAdded.name}</p>
            <p className="text-mute">{lastAdded.size} · bolsa {lastAdded.bagColor} · impresión {lastAdded.inkColor}</p>
            <p className="mt-1">
              {units.toLocaleString("es-AR")} unidades · <strong>{formatARS(lastAdded.quantity * lastAdded.unitPrice)}</strong>
            </p>
          </div>
        </div>

        <div className="anim-item-in mt-5 flex items-end justify-between border-t border-line pt-4" style={{ animationDelay: "220ms" }}>
          <p className="text-sm text-mute">
            Tu pedido · {items.length} {items.length === 1 ? "producto" : "productos"}
          </p>
          <p className="font-display text-2xl font-black text-gradient">
            <AnimatedNumber value={subtotal} format={formatARS} />
          </p>
        </div>

        <div className="anim-item-in mt-6 grid gap-3" style={{ animationDelay: "300ms" }}>
          <Link href="/carrito" className="btn btn-primary w-full" onClick={closeDrawer}>
            Ver pedido y finalizar <IconArrow />
          </Link>
          <button type="button" className="btn btn-ghost w-full" onClick={closeDrawer}>
            Seguir comprando
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-mute">Antes de imprimir te enviamos la prueba de diseño para aprobar.</p>
      </div>
    </div>
  );
}
