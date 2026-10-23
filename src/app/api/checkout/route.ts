import { NextResponse } from "next/server";
import { ValidationError, createOrder, getOrder } from "../../../lib/listings";
import { createCheckout } from "../../../lib/payments";
import type { Scope } from "../../../lib/pricing";
import { clientIp, rateLimit } from "../../../lib/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req.headers)}`, 10, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const b = await req.json().catch(() => null);
  if (!b || typeof b.url !== "string") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const { orderId } = await createOrder({
      urlInput: b.url,
      category: String(b.category ?? ""),
      country: String(b.country ?? "").toUpperCase(),
      scope: String(b.scope ?? "category") as Scope,
      amountCents: Number(b.amountCents),
      email: typeof b.email === "string" ? b.email : null,
    });
    const { url } = await createCheckout(getOrder(orderId)!);
    return NextResponse.json({ checkoutUrl: url });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: (e as Error).message || "Server error" }, { status: 500 });
  }
}
