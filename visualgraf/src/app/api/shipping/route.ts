import { NextResponse } from "next/server";
import { quoteShipping } from "@/lib/settings";
import { provinces } from "@/lib/validation";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const province = u.searchParams.get("provincia") ?? "";
  const subtotal = Number(u.searchParams.get("subtotal") ?? 0);
  if (!(provinces as readonly string[]).includes(province)) return NextResponse.json({ price: null, zone: null, free: false });
  return NextResponse.json(await quoteShipping(province, Number.isFinite(subtotal) ? subtotal : 0));
}
