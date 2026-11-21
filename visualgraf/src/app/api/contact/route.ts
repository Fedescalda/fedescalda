import { NextResponse } from "next/server";
import { clientIp, contactSchema, rateLimited } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (rateLimited(`contact:${clientIp(req)}`, 5)) {
    return NextResponse.json({ ok: false, error: "Demasiados envíos. Probá de nuevo en un minuto." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos" }, { status: 400 });
  }
  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true, stored: false }); // bot

  const sb = createAdminClient();
  if (!sb) return NextResponse.json({ ok: true, stored: false });

  const { error } = await sb.from("contact_messages").insert(data);
  if (error) {
    console.error("[contact] insert error", error.message);
    return NextResponse.json({ ok: true, stored: false });
  }
  return NextResponse.json({ ok: true, stored: true });
}
