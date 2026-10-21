import { NextResponse } from "next/server";
import { ValidationError, fulfillOrder } from "../../../../lib/listings";
import { verifyWebhookSignature } from "../../../../lib/payments";

/** Generic signed webhook: body {orderId, paymentRef}, header x-signature = hex HMAC-SHA256(body). Adapt per provider. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-signature"))) return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  let b: { orderId?: string; paymentRef?: string };
  try { b = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  if (!b.orderId || !b.paymentRef) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  try {
    fulfillOrder(b.orderId, b.paymentRef);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
