import { after, NextResponse } from "next/server";
import { z } from "zod";
import { sendWelcome, subscribe, subscriberSchema, unsubscribe, validUnsubscribeToken } from "@/lib/newsletter";
import { clientIp, rateLimited } from "@/lib/validation";

const payloadSchema = subscriberSchema.extend({ website: z.string().max(0).optional() });

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("baja");
  if (token !== null) {
    if (!validUnsubscribeToken(token)) return NextResponse.json({ ok: false, message: "El enlace de baja no es válido." }, { status: 400 });
    if (!await unsubscribe(token)) return NextResponse.json({ ok: false, message: "No pudimos procesar la baja." }, { status: 503 });
    return new Response(null, { status: 200 });
  }

  if (rateLimited(`nl:${clientIp(request)}`, 5)) {
    return NextResponse.json({ ok: false, message: "Hiciste varios intentos. Probá de nuevo en un minuto." }, { status: 429 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (body && typeof body === "object" && "website" in body && typeof body.website === "string" && body.website) {
    return NextResponse.json({ ok: false });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Revisá los datos e ingresá un email válido." }, { status: 400 });

  const result = await subscribe(parsed.data);
  if (!result.ok) return NextResponse.json({ ok: false, message: "No pudimos guardar tu suscripción. Probá más tarde." }, { status: 503 });
  if (!result.already) {
    const { subscriber } = result;
    after(() => sendWelcome(subscriber));
  }
  return NextResponse.json({ ok: true, message: "¡Ya estás en la lista de Visual Graf!" });
}
