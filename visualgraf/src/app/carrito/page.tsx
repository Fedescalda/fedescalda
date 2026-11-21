import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Checkout } from "@/components/cart/Checkout";
import { isMercadoPagoEnabled } from "@/lib/mercadopago";

export const metadata: Metadata = {
  title: "Tu pedido",
  description: "Revisá tu pedido de bolsas personalizadas y finalizá la compra.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default function CarritoPage() {
  return (
    <>
      <PageHeader eyebrow="Tu compra" title="Tu" highlight="pedido" />
      <div className="container-vg">
        <Checkout mpEnabled={isMercadoPagoEnabled()} />
      </div>
    </>
  );
}
