import Link from "next/link";
import { waLink } from "@/lib/site";
import { IconArrow, IconWhatsApp } from "./Icons";
import { Reveal } from "./Reveal";

export function CtaBand({
  title = "¿Listo para ver tu marca en una bolsa?",
  text = "Mandanos tu logo y la cantidad que necesitás. Te respondemos con el presupuesto.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-vg mt-24">
      <Reveal>
        <div className="noise relative isolate overflow-hidden rounded-[2rem] px-6 py-14 text-center md:px-16 md:py-20" style={{ background: "linear-gradient(120deg,#1a2bd6 0%,#6c1fd8 40%,#d4157e 75%,#ff7a1c 100%)" }}>
          <div className="glow -top-20 left-1/4 h-72 w-72 bg-brand-cyan opacity-40" aria-hidden />
          <h2 className="mx-auto max-w-3xl font-display text-3xl leading-tight font-black text-balance md:text-5xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85 md:text-lg">{text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/personalizar" className="btn bg-white text-ink hover:-translate-y-0.5">
              Probar mi logo <IconArrow />
            </Link>
            <a href={waLink("¡Hola! Quiero cotizar bolsas con mi logo.")} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <IconWhatsApp /> Consultá por WhatsApp
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
