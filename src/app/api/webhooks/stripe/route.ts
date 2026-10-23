import { NextResponse } from "next/server";
import { getOrder } from "../../../../lib/listings";
import { completeOrder } from "../../../../lib/notify";
import { verifyStripeSignature } from "../../../../lib/stripe";

/** Stripe webhook: marks an order paid once Stripe confirms the money. Events: checkout.session.completed and checkout.session.async_payment_succeeded. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data?.object ?? {};
    if (s.payment_status !== "paid") return NextResponse.json({ ok: true, ignored: "not paid yet" });
    const orderId = String(s.client_reference_id ?? (s.metadata as Record<string, string> | undefined)?.orderId ?? "");
    const order = getOrder(orderId);
    if (!order) return NextResponse.json({ ok: true, ignored: "unknown order" });
    // Never fulfil an order if the money received does not match what was ordered.
    if (s.amount_total !== order.amount_cents || String(s.currency).toLowerCase() !== "usd") {
      console.error("[stripe] amount mismatch for order", orderId, s.amount_total, s.currency);
      return NextResponse.json({ ok: true, ignored: "amount mismatch" });
    }
    await completeOrder(orderId, String(s.payment_intent ?? s.id));
  }
  return NextResponse.json({ ok: true });
}
