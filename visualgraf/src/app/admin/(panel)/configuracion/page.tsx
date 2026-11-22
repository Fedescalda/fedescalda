import { ShippingForm } from "@/components/admin/order/ShippingForm";
import { customerEmailsEnabled } from "@/lib/customer-email";
import { notificationChannels } from "@/lib/notify";
import { getShippingConfig } from "@/lib/settings";
import { andreaniConfigured } from "@/lib/andreani";
import { provinces } from "@/lib/validation";
import { getPanelClient } from "../../session";

export default async function SettingsPage() {
  if (!await getPanelClient()) return null;

  const config = await getShippingConfig();
  const channels = notificationChannels();
  const services = [
    { name: "Mercado Pago", ready: Boolean(process.env.MP_ACCESS_TOKEN && process.env.MP_WEBHOOK_SECRET), variables: ["MP_ACCESS_TOKEN", "MP_WEBHOOK_SECRET"] },
    { name: "Andreani", ready: andreaniConfigured(), variables: ["ANDREANI_CLIENTE", "ANDREANI_CONTRATO"] },
    { name: "Transferencia", ready: Boolean(process.env.TRANSFER_ALIAS), variables: ["TRANSFER_ALIAS"] },
    { name: "Emails al cliente", ready: customerEmailsEnabled(), variables: ["RESEND_API_KEY", "CUSTOMER_EMAIL_FROM"] },
    { name: "Avisos por email", ready: channels.email, variables: ["RESEND_API_KEY", "NOTIFY_EMAIL"] },
    { name: "Avisos por Telegram", ready: channels.telegram, variables: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Configuración</h1>
      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="text-xl font-bold">Envíos</h2>
        <ShippingForm config={config} provinces={provinces} andreaniReady={andreaniConfigured()} />
      </section>
      <section className="card space-y-3 p-4 sm:p-5">
        <h2 className="text-xl font-bold">Pagos y avisos</h2>
        <p className="text-sm text-mute">Cargá en Vercel las variables de cada servicio.</p>
        <dl className="divide-y divide-white/10">
          {services.map(({ name, ready, variables }) => (
            <div key={name} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <dt className="font-semibold">{name}</dt>
              <dd className="space-y-1">
                <span className={ready ? "text-brand-green" : "text-brand-yellow"}>{ready ? "Configurado" : "Falta"}</span>
                <div className="flex flex-wrap gap-x-3 text-sm text-mute">
                  {variables.map((variable) => <code key={variable} className="break-all">{variable}</code>)}
                </div>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
