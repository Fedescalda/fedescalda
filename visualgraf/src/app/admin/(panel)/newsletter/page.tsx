import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { newsletterEnabled, renderCampaign, type Campaign } from "@/lib/newsletter";
import { site } from "@/lib/site";
import { addSubscriber, publishCampaign, saveCampaign, testCampaign } from "../../newsletter-actions";
import { getPanelClient } from "../../session";

const path = "/admin/newsletter";
const pageSize = 50;
const date = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

function CampaignFields({ campaign }: { campaign?: Campaign }) {
  return (
    <>
      <label className="grid gap-1">Asunto
        <input name="subject" className="field" defaultValue={campaign?.subject} required maxLength={200} />
      </label>
      <label className="grid gap-1">Preheader
        <input name="preheader" className="field" defaultValue={campaign?.preheader ?? ""} maxLength={250} />
      </label>
      <label className="grid gap-1">Cuerpo
        <textarea name="body" className="field" defaultValue={campaign?.body} rows={8} required maxLength={30_000} />
      </label>
      <label className="grid gap-1">URL de la imagen
        <input name="image" className="field" defaultValue={campaign?.image ?? ""} maxLength={2048} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">Texto del botón
          <input name="cta_label" className="field" defaultValue={campaign?.cta_label ?? ""} maxLength={100} />
        </label>
        <label className="grid gap-1">URL del botón
          <input name="cta_url" className="field" defaultValue={campaign?.cta_url ?? ""} maxLength={2048} />
        </label>
      </div>
    </>
  );
}

export default async function NewsletterAdmin({ searchParams }: {
  searchParams: Promise<{ p?: string; campana?: string; fallidos?: string }>;
}) {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const params = await searchParams;
  const requestedPage = Number(params.p);
  const [activeResult, inactiveResult, campaignResult] = await Promise.all([
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "activo"),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "baja"),
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
  ]);
  const active = activeResult.count ?? 0;
  const inactive = inactiveResult.count ?? 0;
  const lastPage = Math.max(1, Math.ceil((active + inactive) / pageSize));
  const page = Number.isSafeInteger(requestedPage) ? Math.min(lastPage, Math.max(1, requestedPage)) : 1;
  const offset = (page - 1) * pageSize;
  const subscriberResult = await supabase.from("subscribers").select("id,email,name,source,consent_at,status")
    .order("created_at", { ascending: false }).order("id").range(offset, offset + pageSize - 1);

  const campaigns = campaignResult.data ?? [];
  const drafts = campaigns.filter((campaign) => campaign.status === "borrador");
  const selected = campaigns.find((campaign) => campaign.id === params.campana);
  const draft = selected?.status === "borrador" ? selected : undefined;
  const enabled = newsletterEnabled();
  const missing = [
    !process.env.RESEND_API_KEY && "RESEND_API_KEY",
    !process.env.NEWSLETTER_FROM && !process.env.CUSTOMER_EMAIL_FROM && "NEWSLETTER_FROM o CUSTOMER_EMAIL_FROM",
  ].filter(Boolean).join(", ");
  const pageHref = (number: number) => `${path}?p=${number}${draft ? `&campana=${draft.id}` : ""}`;
  const failed = Number(params.fallidos);
  const campaignReadFailed = Boolean(campaignResult.error);
  const subscriberReadFailed = Boolean(activeResult.error || inactiveResult.error || subscriberResult.error);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Newsletter</h1>
        {subscriberReadFailed ? <p role="alert">No pudimos cargar todos los datos de suscriptores.</p> : (
          <p className="text-mute">{active} activos · {inactive} bajas</p>
        )}
      </header>

      <section className="card space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Suscriptores</h2>
          <a href="/admin/newsletter-export" className="btn btn-ghost">Exportar CSV</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-mute">
              <tr>{["Email", "Nombre", "Origen", "Fecha de consentimiento", "Estado"].map((heading) =>
                <th key={heading} scope="col" className="px-2 py-2">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {subscriberResult.data?.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-2">{row.email}</td>
                  <td className="px-2 py-2">{row.name || "—"}</td>
                  <td className="px-2 py-2">{row.source}</td>
                  <td className="px-2 py-2">{date.format(new Date(row.consent_at))}</td>
                  <td className="px-2 py-2">{row.status === "activo" ? "Activo" : "Baja"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {subscriberResult.data?.length === 0 && <p className="text-mute">No hay suscriptores en esta página.</p>}
        {lastPage > 1 && (
          <nav aria-label="Páginas de suscriptores" className="flex flex-wrap items-center gap-3">
            {page > 1 && <Link className="btn btn-ghost" href={pageHref(page - 1)}>Anterior</Link>}
            <span className="text-sm text-mute">Página {page} de {lastPage}</span>
            {page < lastPage && <Link className="btn btn-ghost" href={pageHref(page + 1)}>Siguiente</Link>}
          </nav>
        )}
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-xl font-bold">Agregar suscriptor</h2>
        <ActionForm action={addSubscriber} label="Agregar suscriptor" resetOnSuccess>
          <label className="grid gap-1">Email<input className="field" name="email" type="email" required maxLength={254} /></label>
          <label className="grid gap-1">Nombre (opcional)<input className="field" name="name" maxLength={80} /></label>
          <label className="flex items-start gap-2 text-sm text-mute">
            <input name="consent" type="checkbox" required className="mt-1" />
            Tengo el consentimiento de esta persona para suscribirla.
          </label>
        </ActionForm>
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-xl font-bold">Campañas</h2>
        {!enabled && <p role="status">Para habilitar los envíos, configurá {missing} y usá un remitente con dominio verificado en Resend.</p>}
        {campaignReadFailed && <p role="alert">No pudimos cargar las campañas.</p>}
        {selected?.status === "enviada" && Number.isSafeInteger(failed) && failed >= 0 && (
          <p role="status">Emails aceptados por Resend: {selected.recipients}. Fallidos: {failed}.</p>
        )}
        <nav aria-label="Borradores de campaña" className="flex flex-wrap gap-2">
          <Link href={path} className="btn btn-ghost" aria-current={!draft ? "page" : undefined}>Nueva campaña</Link>
          {drafts.map((entry) => (
            <Link key={entry.id} href={`${path}?campana=${entry.id}`} className="btn btn-ghost max-w-full whitespace-normal" aria-current={entry.id === draft?.id ? "page" : undefined}>
              {entry.subject}
            </Link>
          ))}
        </nav>
        <h3 className="font-bold">{draft ? "Editar borrador" : "Crear borrador"}</h3>
        <ActionForm key={draft?.id ?? "new"} action={saveCampaign.bind(null, draft?.id ?? null)} label="Guardar borrador">
          <CampaignFields campaign={draft} />
        </ActionForm>
        {draft && (
          <div className="space-y-4">
            <h3 className="font-bold">Vista previa del borrador guardado</h3>
            <iframe title="Vista previa de la campaña" sandbox="" srcDoc={renderCampaign(draft, `${site.url}/baja/preview`)} className="h-96 w-full rounded-xl bg-white" />
            {enabled ? (
              <div className="flex flex-wrap gap-3">
                {process.env.NOTIFY_EMAIL ? (
                  <ActionForm action={testCampaign.bind(null, draft.id)} label="Enviarme una prueba" secondary />
                ) : (
                  <p className="text-mute">Configurá NOTIFY_EMAIL para recibir una prueba.</p>
                )}
                {active > 0 && !subscriberReadFailed ? (
                  <ActionForm action={publishCampaign.bind(null, draft.id, active)} label={`Enviar a ${active} suscriptores`}
                    confirm={`¿Confirmás el envío de «${draft.subject}» a ${active} suscriptores?`} />
                ) : (
                  <button className="btn btn-primary" disabled>Enviar a {active} suscriptores</button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-ghost" disabled>Enviarme una prueba</button>
                <button className="btn btn-primary" disabled>Enviar a {active} suscriptores</button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-xl font-bold">Historial de campañas</h2>
        {campaigns.some((campaign) => campaign.status !== "borrador") ? (
          <ul className="space-y-2">
            {campaigns.filter((campaign) => campaign.status !== "borrador").map((campaign) => (
              <li key={campaign.id}>
                <strong>{campaign.subject}</strong>{" · "}
                {campaign.sent_at ? `${date.format(new Date(campaign.sent_at))} · ${campaign.recipients} emails aceptados` : "Envío en curso o pendiente de cierre"}
              </li>
            ))}
          </ul>
        ) : !campaignReadFailed && <p className="text-mute">Todavía no enviaste campañas.</p>}
      </section>
    </div>
  );
}
