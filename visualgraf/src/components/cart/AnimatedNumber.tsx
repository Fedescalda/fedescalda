"use client";
import { useEffect, useRef, useState } from "react";

/** Número que "corre" hasta su nuevo valor. Lectores de pantalla solo reciben el valor final. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value); // último valor realmente mostrado (para retomar sin saltos)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = shownRef.current;
    if (reduce || start === value) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    const dur = 450;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const v = Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3)));
      shownRef.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <>
      <span aria-hidden className="tabular-nums">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
