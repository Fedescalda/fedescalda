import { statusLabel, type OrderStatus } from "@/lib/order-status";

export const orderStatuses = statusLabel;

export const orderStatusColors: Record<OrderStatus, string> = {
  pendiente: "text-brand-yellow",
  pagado: "text-brand-green",
  diseno: "text-brand-cyan",
  en_produccion: "text-brand-yellow",
  enviado: "text-brand-cyan",
  entregado: "text-brand-green",
  cancelado: "text-red-300",
};

export const paymentLabels: Record<string, string> = {
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
  whatsapp: "WhatsApp",
};

const dateTime = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatDate(value: string) {
  return dateTime.format(new Date(value));
}

export function customerWhatsApp(phone: string, message: string) {
  const number = phone.replace(/\D/g, "");
  if (number.length < 8 || number.length > 15) return null;
  const local = number.length === 10 && !phone.trim().startsWith("+");
  return `https://wa.me/${local ? "549" : ""}${number}?text=${encodeURIComponent(message)}`;
}

export function orderWhatsApp(phone: string, message: string) {
  let local = phone.replace(/\D/g, "").replace(/^00/, "");
  if (local.length > 10) local = local.replace(/^549?/, "").replace(/^0/, "");
  if (local.length === 12) local = local.replace(/^(11|[23]\d{2,3})15(?=\d+$)/, "$1");
  return /^[1-3]\d{9}$/.test(local) ? customerWhatsApp(local, message) : null;
}
