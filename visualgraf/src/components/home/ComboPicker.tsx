"use client";
import Link from "next/link";
import { useState } from "react";
import { bagColors, inkColors, type BagColorId } from "@/lib/catalog";
import { BagMockup } from "../BagMockup";
import { IconArrow } from "../Icons";

export function ComboPicker() {
  const [bag, setBag] = useState<BagColorId>("negro");
  const [ink, setInk] = useState(inkColors[8]); // oro

  return (
    <div className="card relative grid items-center gap-8 overflow-hidden p-5 md:grid-cols-[1fr_1.1fr] md:p-10">
      <div className="glow -top-20 -left-20 h-72 w-72 bg-brand-violet opacity-30" aria-hidden />
      <div className="relative mx-auto w-full max-w-[19rem]">
        <BagMockup id="combo" color={bag} className="h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.5)]" title={`Bolsa ${bag} con impresión ${ink.name}`}>
          <g fill={ink.hex} fontFamily="var(--font-montserrat), sans-serif" textAnchor="middle">
            <circle cx="200" cy="225" r="54" fill="none" stroke={ink.hex} strokeWidth="9" />
            <path d="M176 205 L200 250 L224 205" fill="none" stroke={ink.hex} strokeWidth="12" strokeLinejoin="round" />
            <text x="200" y="340" fontSize="40" fontWeight="900" letterSpacing="-1">TU MARCA</text>
            <text x="200" y="372" fontSize="14" fontWeight="700" letterSpacing="5">@tuemprendimiento</text>
          </g>
        </BagMockup>
      </div>

      <div className="relative">
        <fieldset>
          <legend className="eyebrow mb-3">Colores de bolsa</legend>
          <div className="flex flex-wrap gap-2">
            {bagColors.filter((b) => b.id !== "rosa").map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBag(b.id)}
                aria-pressed={bag === b.id}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${bag === b.id ? "border-white bg-white/10" : "border-line hover:border-white/40"}`}
              >
                <span className="h-5 w-5 rounded-full border border-white/30" style={{ background: b.id === "cristal" ? "linear-gradient(135deg,#fff8,#cfe3f340)" : b.hex }} aria-hidden />
                {b.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="eyebrow mb-3">Colores de impresión</legend>
          <div className="grid grid-cols-6 gap-2.5 sm:flex sm:flex-wrap">
            {inkColors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setInk(c)}
                aria-pressed={ink.id === c.id}
                aria-label={c.name}
                title={c.name}
                className={`relative grid aspect-square w-full place-items-center rounded-full transition sm:h-11 sm:w-11 ${ink.id === c.id ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-ink" : "hover:scale-105"}`}
                style={{ background: c.id === "oro" ? "linear-gradient(135deg,#f4d77d,#a77b23)" : c.id === "plata" ? "linear-gradient(135deg,#f1f2f4,#8e939b)" : c.hex, border: "1px solid rgba(255,255,255,.25)" }}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-mute" aria-live="polite">
            Bolsa <strong className="text-white">{bagColors.find((b) => b.id === bag)?.name}</strong> + impresión <strong className="text-white">{ink.name}</strong>
          </p>
        </fieldset>

        <Link href={`/personalizar?bolsa=${bag}&tinta=${ink.id}`} className="btn btn-primary mt-8 w-full sm:w-auto">
          Probalo con tu logo <IconArrow />
        </Link>
      </div>
    </div>
  );
}
