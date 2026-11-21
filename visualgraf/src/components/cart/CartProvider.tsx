"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
  add: (item: Omit<CartItem, "key">) => void;
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback<CartCtx["add"]>((item) => {
    const key = itemKey(item);
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
    }),
    [items, ready, add, update, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return c;
}
