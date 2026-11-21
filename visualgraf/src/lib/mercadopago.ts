import "server-only";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { site } from "./site";

export const isMercadoPagoEnabled = () => Boolean(process.env.MP_ACCESS_TOKEN);

function client() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

export type PreferenceLine = { id: string; title: string; quantity: number; unitPrice: number };

/** Crea una preferencia de Checkout Pro y devuelve la URL de pago. */
export async function createPreference(opts: {
  orderId: string;
  /** token del pedido para volver a su página */
  token: string;
  lines: PreferenceLine[];
  payer: { name: string; email: string };
}) {
  const c = client();
  if (!c) throw new Error("Mercado Pago no está configurado");
  const isPublic = site.url.startsWith("https://");
  const pref = await new Preference(c).create({
    body: {
      items: opts.lines.map((l) => ({
        id: l.id,
        title: l.title.slice(0, 250),
        quantity: l.quantity,
        unit_price: Math.round(l.unitPrice),
        currency_id: "ARS",
      })),
      payer: { name: opts.payer.name, email: opts.payer.email },
      external_reference: opts.orderId,
      statement_descriptor: "VISUALGRAF",
      back_urls: {
        success: `${site.url}/pedido/${opts.token}?pago=exito`,
        pending: `${site.url}/pedido/${opts.token}?pago=pendiente`,
        failure: `${site.url}/pedido/${opts.token}?pago=error`,
      },
      // Mercado Pago exige URLs públicas https para auto_return y webhooks
      ...(isPublic && { auto_return: "approved", notification_url: `${site.url}/api/mercadopago/webhook` }),
    },
  });
  return { id: pref.id, initPoint: pref.init_point };
}

export async function getPayment(id: string) {
  const c = client();
  if (!c) throw new Error("Mercado Pago no está configurado");
  return new Payment(c).get({ id });
}
