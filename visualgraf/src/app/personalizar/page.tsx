import type { Metadata } from "next";
import { Suspense } from "react";
import { Customizer } from "@/components/customizer/Customizer";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Personalizá tu bolsa: probá tu logo online",
  description: "Subí tu logo y mirá al instante cómo queda impreso en tu bolsa. Elegí modelo, color de bolsa y color de impresión, descargá la imagen y pedí tu presupuesto.",
  alternates: { canonical: "/personalizar" },
};

export default function PersonalizarPage() {
  return (
    <>
      <PageHeader eyebrow="Simulador online · gratis" title="Mirá tu marca" highlight="en tu bolsa." text="Subí tu logo, elegí la bolsa y el color de impresión. En segundos ves cómo queda. Después descargá la imagen o pedí tu presupuesto." />
      <div className="container-vg">
        <Suspense fallback={<div className="h-[600px] animate-pulse rounded-[2rem] bg-white/5" />}>
          <Customizer />
        </Suspense>
      </div>
    </>
  );
}
