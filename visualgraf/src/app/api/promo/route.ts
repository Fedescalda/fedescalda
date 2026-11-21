import { NextResponse } from "next/server";
import { findPromoCode } from "@/lib/data";
import { clientIp, rateLimited } from "@/lib/validation";

export async function GET(req: Request) {
  if (rateLimited(`promo:${clientIp(req)}`, 15)) return NextResponse.json({ ok: false }, { status: 429 });
  const code = new URL(req.url).searchParams.get("code")?.slice(0, 30) ?? "";
  const promo = code ? await findPromoCode(code) : null;
  return NextResponse.json(promo ? { ok: true, code: promo.code, percent: promo.discountPercent } : { ok: false });
}
