import { ActionForm } from "@/components/admin/ActionForm";
import { markAnswered } from "../../actions";
import { customerWhatsApp, formatDate } from "../../display";
import { getPanelClient } from "../../session";

export default async function MessagesPage() {
  const supabase = await getPanelClient();
  if (!supabase) return null;

  const { data: messages, error } = await supabase.from("contact_messages")
    .select("id, name, business, email, phone, province, interest, message, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Consultas</h1>
      {error && <p role="alert">No pudimos cargar las consultas.</p>}
      {!error && !messages?.length && <p className="text-mute">Todavía no hay consultas.</p>}
      {messages?.map((message) => {
        const whatsapp = message.phone && customerWhatsApp(message.phone, `Hola ${message.name}, te escribimos de Visual Graf por tu consulta.`);
        const answered = message.status === "respondido";

        return (
          <article key={message.id} className="card space-y-3 break-words p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">{message.name}</h2>
              <time dateTime={message.created_at} className="text-sm text-mute">{formatDate(message.created_at)}</time>
            </div>
            <p className="text-sm text-mute">
              {[message.business, message.province, message.interest, answered ? "Respondida" : "Nueva"].filter(Boolean).join(" · ")}
            </p>
            <p className="whitespace-pre-wrap">{message.message}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a href={`mailto:${encodeURIComponent(message.email).replace("%40", "@")}`} className="underline">{message.email}</a>
              {whatsapp ? <a href={whatsapp} className="underline">WhatsApp ({message.phone})</a> : message.phone}
            </div>
            {!answered && <ActionForm action={markAnswered.bind(null, message.id)} label="Marcá como respondida" secondary />}
          </article>
        );
      })}
    </section>
  );
}
