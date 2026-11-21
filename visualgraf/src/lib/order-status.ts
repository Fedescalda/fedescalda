// Estados del pedido (compartido cliente/servidor).
export const ORDER_STATUSES = ["pendiente", "pagado", "diseno", "en_produccion", "enviado", "entregado", "cancelado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusLabel: Record<OrderStatus, string> = {
  pendiente: "Pendiente de pago",
  pagado: "Pago acreditado",
  diseno: "Diseño para aprobar",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Texto para el cliente en la página de seguimiento y en los emails. */
export const statusText: Record<OrderStatus, string> = {
  pendiente: "Recibimos tu pedido. Cuando se acredite el pago empezamos a preparar tu diseño.",
  pagado: "¡Pago acreditado! Estamos preparando la prueba de diseño con tu logo.",
  diseno: "Tu prueba de diseño está lista. Revisala y aprobala para que pasemos a producción.",
  en_produccion: "Aprobaste el diseño y tus bolsas ya están en producción.",
  enviado: "¡Tus bolsas están en camino!",
  entregado: "Tu pedido fue entregado. ¡Gracias por elegir Visual Graf!",
  cancelado: "Este pedido fue cancelado. Si tenés dudas, escribinos.",
};

/** Pasos que se muestran en la línea de tiempo (cancelado va aparte). */
export const timelineSteps: OrderStatus[] = ["pendiente", "pagado", "diseno", "en_produccion", "enviado", "entregado"];

export const isOrderStatus = (v: string): v is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(v);

export type HistoryEntry = { status: OrderStatus; at: string; note?: string };
