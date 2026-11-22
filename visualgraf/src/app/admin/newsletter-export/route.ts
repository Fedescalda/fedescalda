import { getAdminClient } from "../session";

function csvCell(value: string | null) {
  const text = value ?? "";
  const safe = /^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET() {
  const supabase = await getAdminClient();
  if (!supabase) return new Response("No tenés permisos para exportar suscriptores.", { status: 403 });

  const lines = ["Email;Nombre;Origen;Fecha de consentimiento;Estado"];
  let lastId: string | undefined;
  for (;;) {
    const query = supabase.from("subscribers").select("id,email,name,source,consent_at,status").order("id").limit(500);
    const { data, error } = await (lastId ? query.gt("id", lastId) : query);
    if (error) return new Response("No pudimos exportar los suscriptores.", { status: 500 });

    for (const row of data) {
      lines.push([row.email, row.name, row.source, row.consent_at, row.status].map(csvCell).join(";"));
    }
    if (data.length < 500) break;
    lastId = data[data.length - 1].id;
  }

  return new Response(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="suscriptores.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
