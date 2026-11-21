export const orderStatuses = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  en_produccion: "En producción",
  enviado: "Enviado",
  cancelado: "Cancelado",
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
