import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Checkout } from "@/components/cart/Checkout";
import { isMercadoPagoEnabled } from "@/lib/mercadopago";
import { transferInfo } from "@/lib/settings";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
        <Checkout
          methods={{
            // Los pagos online necesitan la base de datos para registrar y conciliar el pedido
            mercadopago: isMercadoPagoEnabled() && isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
            transferencia: Boolean(transferInfo()) && isSupabaseConfigured && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          }}
        />
      </div>
    </>
  );
}
