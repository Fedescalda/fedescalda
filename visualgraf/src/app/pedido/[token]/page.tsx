import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/cart/ClearCart";
import { ApproveProof, PayAgain, UploadLogo } from "@/components/order/OrderForms";
import { IconWhatsApp } from "@/components/Icons";
import { getOrderByToken } from "@/lib/order-events";
import { signedUrl } from "@/lib/order-files";
import { isOrderStatus, statusLabel, statusText, timelineSteps } from "@/lib/order-status";
import { transferInfo } from "@/lib/settings";
import { formatARS, waLink } from "@/lib/site";
import { approveProof, payAgain, requestChanges, uploadLogo } from "./actions";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const isImage = (p?: string | null) => !!p && /\.(png|jpe?g|webp)$/i.test(p);

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ pago?: string; nuevo?: string }> }) {
  const { token } = await params;
  const { pago, nuevo } = await searchParams;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const n = order.id.slice(0, 8).toUpperCase();
  const status = isOrderStatus(order.status) ? order.status : "pendiente";
  const stepIndex = timelineSteps.indexOf(status);
  const [logoUrl, mockupUrl, proofUrl] = await Promise.all([signedUrl(order.logo_path, 3600), signedUrl(order.mockup_path, 3600), signedUrl(order.proof_path, 3600)]);
  const transfer = order.payment_method === "transferencia" ? transferInfo() : null;
  const hasDesign = Boolean(order.logo_path || order.mockup_path);

  return (
    <div className="container-vg max-w-4xl pt-32 pb-10 md:pt-36">
      {(nuevo || pago === "exito") && <ClearCart />}

      <p className="eyebrow">Pedido #{n}</p>
      <h1 className="mt-2 font-display text-3xl font-black md:text-5xl">
        {status === "pendiente" && pago === "exito" ? "Estamos confirmando tu pago…" : statusLabel[status]}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-white/80">
        {status === "pendiente" && pago === "exito"
          ? "Mercado Pago nos está avisando. Esta página se actualiza en unos segundos (recargala si hace falta)."
          : status === "pendiente" && pago === "error"
            ? "El pago no se completó. Podés intentarlo de nuevo cuando quieras."
            : statusText[status]}
      </p>
      {nuevo && <p className="mt-3 text-sm text-mute">Te mandamos un email con esta información. Guardá este link para seguir tu pedido.</p>}

      {/* Línea de tiempo */}
      {status !== "cancelado" && (
        <ol className="mt-10 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Estado del pedido">
          {timelineSteps.map((s, i) => {
            const done = i <= stepIndex;
            return (
              <li key={s} aria-current={s === status ? "step" : undefined} className="flex flex-col gap-2">
                <span className="h-1.5 rounded-full" style={{ background: done ? "var(--rainbow)" : "rgba(255,255,255,.12)" }} />
                <span className={`text-xs ${done ? "font-semibold text-white" : "text-mute"}`}>{statusLabel[s]}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-10 grid gap-5">
        {/* Pago pendiente */}
        {status === "pendiente" && transfer && (
          <section className="card p-6" aria-labelledby="transfer">
            <h2 id="transfer" className="font-display text-xl font-black">Datos para transferir</h2>
            <p className="mt-1 text-white/80">Total a transferir: <strong className="text-gradient font-display text-2xl">{formatARS(Number(order.total))}</strong></p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {transfer.alias && <div><dt className="text-mute">Alias</dt><dd className="font-mono text-base font-bold select-all">{transfer.alias}</dd></div>}
              {transfer.cbu && <div><dt className="text-mute">CBU / CVU</dt><dd className="font-mono select-all">{transfer.cbu}</dd></div>}
              {transfer.holder && <div><dt className="text-mute">Titular</dt><dd>{transfer.holder}</dd></div>}
              {transfer.bank && <div><dt className="text-mute">Banco</dt><dd>{transfer.bank}</dd></div>}
            </dl>
            <p className="mt-4 text-sm text-mute">Cuando acreditemos la transferencia, el pedido avanza solo y te avisamos por email.</p>
            <a className="btn btn-whatsapp mt-4" href={waLink(`Hola! Les envío el comprobante de transferencia del pedido #${n}`)} target="_blank" rel="noopener noreferrer"><IconWhatsApp /> Enviar comprobante</a>
          </section>
        )}
        {status === "pendiente" && order.payment_method === "mercadopago" && pago !== "exito" && (
          <section className="card p-6">
            <h2 className="font-display text-xl font-black">Pago pendiente</h2>
            <p className="mt-1 mb-4 text-white/80">Total: <strong>{formatARS(Number(order.total))}</strong></p>
            <PayAgain action={payAgain.bind(null, token)} />
          </section>
        )}

        {/* Prueba de diseño */}
        {proofUrl && (
          <section className="card p-6" aria-labelledby="prueba">
            <h2 id="prueba" className="font-display text-xl font-black">Tu prueba de diseño</h2>
            {isImage(order.proof_path) ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal
              <img src={proofUrl} alt="Prueba de diseño de tu bolsa" className="mt-4 max-h-[32rem] w-full rounded-2xl border border-line bg-white object-contain" />
            ) : (
              <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-4">Ver prueba (PDF)</a>
            )}
            <div className="mt-5">
              {order.proof_status === "enviada" && <ApproveProof approve={approveProof.bind(null, token)} changes={requestChanges.bind(null, token)} version={order.proof_version ?? 0} />}
              {order.proof_status === "aprobada" && (
                <p className="font-semibold text-brand-green">
                  ✓ Aprobaste este diseño{order.proof_approved_at ? ` el ${new Date(order.proof_approved_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })} h` : ""}
                </p>
              )}
              {order.proof_status === "cambios" && <p className="text-white/80">Pediste cambios: “{order.proof_feedback}”. Te mandamos una nueva prueba en breve.</p>}
            </div>
          </section>
        )}

        {/* Logo */}
        {!["enviado", "entregado", "cancelado"].includes(status) && (
          <section className="card p-6" aria-labelledby="logo">
            <h2 id="logo" className="font-display text-xl font-black">Tu logo</h2>
            {hasDesign ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {mockupUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal
                  <img src={mockupUrl} alt="Diseño que armaste en el simulador" className="h-40 rounded-xl border border-line bg-ink-3 object-contain" />
                )}
                {logoUrl && isImage(order.logo_path) && (
                  // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal
                  <img src={logoUrl} alt="Logo que subiste" className="h-40 rounded-xl border border-line bg-white object-contain p-2" />
                )}
                {logoUrl && !isImage(order.logo_path) && <a href={logoUrl} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">Ver logo enviado</a>}
              </div>
            ) : (
              <p className="mt-2 text-brand-yellow">Todavía no recibimos tu logo. Subilo para que preparemos tu diseño.</p>
            )}
            <div className="mt-5"><UploadLogo action={uploadLogo.bind(null, token)} hasLogo={hasDesign} /></div>
          </section>
        )}

        {/* Envío */}
        {(status === "enviado" || status === "entregado") && (order.carrier || order.tracking_code) && (
          <section className="card p-6">
            <h2 className="font-display text-xl font-black">Envío</h2>
            <p className="mt-2 text-white/80">
              {order.carrier && <>Transporte: <strong>{order.carrier}</strong><br /></>}
              {order.tracking_code && <>Código de seguimiento: <strong className="font-mono select-all">{order.tracking_code}</strong></>}
            </p>
          </section>
        )}

        {/* Resumen */}
        <section className="card p-6" aria-labelledby="resumen">
          <h2 id="resumen" className="font-display text-xl font-black">Resumen</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {order.items.map((i, k) => (
              <li key={k} className="flex justify-between gap-4 py-3">
                <span>{i.name} {i.size}<span className="block text-mute">Bolsa {i.bagColor} · impresión {i.inkColor} · {i.quantity}×{i.packSize} u.</span></span>
                <span className="whitespace-nowrap">{formatARS(i.quantity * i.unitPrice)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
            {Number(order.discount) > 0 && <div className="flex justify-between text-brand-green"><dt>Descuento</dt><dd>-{formatARS(Number(order.discount))}</dd></div>}
            <div className="flex justify-between text-mute"><dt>Envío{order.shipping_zone ? ` (${order.shipping_zone})` : ""}</dt><dd>{order.shipping_zone ? (Number(order.shipping) ? formatARS(Number(order.shipping)) : "Gratis") : "A coordinar"}</dd></div>
            <div className="flex justify-between font-display text-lg font-black"><dt>Total</dt><dd>{formatARS(Number(order.total))}</dd></div>
          </dl>
          <p className="mt-4 text-sm text-mute">Envío a: {[order.customer.name, (order.customer as { address?: string }).address, (order.customer as { city?: string }).city, (order.customer as { province?: string }).province].filter(Boolean).join(", ")}</p>
        </section>

        <a href={waLink(`Hola! Consulta por mi pedido #${n}`)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-fit"><IconWhatsApp /> ¿Dudas? Escribinos</a>
      </div>
    </div>
  );
}
