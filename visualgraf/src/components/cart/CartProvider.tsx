"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = {
  key: string; // producto + opciones
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  bagColor: string;
  inkColor: string;
  /** Cantidad de packs */
  quantity: number;
  /** Unidades por pack */
  packSize: number;
  /** Precio por pack (ARS) */
  unitPrice: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  /** último ítem agregado (para el panel lateral) */
  lastAdded: CartItem | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** cambia en cada agregado: dispara la animación del ícono */
  pulse: number;
  add: (item: Omit<CartItem, "key">, opts?: { silent?: boolean }) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "vg-cart-v2";

export function itemKey(i: Pick<CartItem, "productId" | "size" | "bagColor" | "inkColor">) {
  return [i.productId, i.size, i.bagColor, i.inkColor].join("|");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelOpen = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = null;
  }, []);
  const openDrawer = useCallback(() => {
    cancelOpen();
    setDrawerOpen(true);
  }, [cancelOpen]);
  const closeDrawer = useCallback(() => {
    cancelOpen();
    setDrawerOpen(false);
  }, [cancelOpen]);
  useEffect(() => cancelOpen, [cancelOpen]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setItems(
          parsed.filter(
            (i): i is CartItem =>
              i && typeof i === "object" && typeof i.key === "string" && typeof i.name === "string" &&
              Number.isFinite(i.quantity) && i.quantity > 0 && Number.isFinite(i.unitPrice) && Number.isFinite(i.packSize),
          ),
        );
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback<CartCtx["add"]>((item, opts) => {
    const key = itemKey(item);
    setLastAdded({ ...item, key });
    setPulse((n) => n + 1);
    // el panel se abre cuando termina la animación "vuela al carrito" (o al instante sin animaciones)
    if (!opts?.silent) {
      if (openTimer.current) clearTimeout(openTimer.current);
      const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      openTimer.current = setTimeout(() => {
        openTimer.current = null;
        setDrawerOpen(true);
      }, reduce ? 0 : 720);
    }
    setItems((prev) => {
      const found = prev.find((p) => p.key === key);
      if (found) return prev.map((p) => (p.key === key ? { ...p, quantity: p.quantity + item.quantity, unitPrice: item.unitPrice } : p));
      return [...prev, { ...item, key }];
    });
  }, []);

  const update = useCallback((key: string, quantity: number) => {
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, quantity } : p)));
  }, []);
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      ready,
      count: items.length,
      subtotal: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      add,
      update,
      remove,
      clear,
      lastAdded,
      drawerOpen,
      pulse,
      openDrawer,
      closeDrawer,
    }),
    [items, ready, add, update, remove, clear, lastAdded, drawerOpen, pulse, openDrawer, closeDrawer],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return c;
}
