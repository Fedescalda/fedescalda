import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo usa Visual Graf los datos que nos dejás en el sitio.",
  alternates: { canonical: "/privacidad" },
};

// ⚠️ Texto base: revisarlo con un profesional antes de publicar.
export default function PrivacidadPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Política de" highlight="privacidad" />
      <div className="container-vg max-w-3xl space-y-6 text-white/80 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-white">
        <p>En Visual Graf cuidamos tus datos. Esta política explica qué información recopilamos en este sitio y para qué la usamos.</p>
        <h2>Qué datos recopilamos</h2>
        <p>Los que nos dejás al completar el formulario de contacto o al hacer un pedido: nombre, email, teléfono, negocio, CUIT (opcional) y dirección de envío. Los pagos se procesan en Mercado Pago: no almacenamos datos de tarjetas.</p>
        <h2>Tu logo</h2>
        <p>El simulador procesa la imagen de tu logo en tu propio dispositivo. No se sube ni se guarda en nuestros servidores. Solo recibimos tu logo si nos lo enviás por WhatsApp o email.</p>
        <h2>Para qué los usamos</h2>
        <p>Para responder tus consultas, procesar y enviar tus pedidos y coordinar la impresión. No vendemos ni compartimos tus datos con terceros, salvo los necesarios para cobrar (Mercado Pago) y enviar tu pedido (empresas de transporte).</p>
        <h2>Tus derechos</h2>
        <p>Podés pedir acceso, rectificación o eliminación de tus datos escribiendo a <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>, conforme a la Ley 25.326 de Protección de Datos Personales. La Agencia de Acceso a la Información Pública es el órgano de control de esa ley.</p>
        <h2>Almacenamiento local</h2>
        <p>Usamos el almacenamiento de tu navegador solo para recordar los productos de tu pedido.</p>
      </div>
    </>
  );
}
