import crypto from "node:crypto";
import { BRAND, SITE_URL, categoryLabel } from "./config";
import { countryName } from "./countries";
import type { Order } from "./listings";
import { SCOPE_LABEL } from "./pricing";

const API = "https://api.stripe.com/v1";

/** Creates a hosted Stripe Checkout page for an order and returns its URL. Amounts are in US dollars. */
export async function createStripeCheckout(order: Order): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Payments are not configured.");
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("client_reference_id", order.id);
  p.set("metadata[orderId]", order.id);
  p.set("payment_intent_data[metadata][orderId]", order.id);
  p.set("line_items[0][quantity]", "1");
  p.set("line_items[0][price_data][currency]", "usd");
  p.set("line_items[0][price_data][unit_amount]", String(order.amount_cents));
  p.set("line_items[0][price_data][product_data][name]", `${BRAND} ${SCOPE_LABEL[order.scope]} rank: ${order.title}`.slice(0, 250));
  p.set("line_items[0][price_data][product_data][description]", `${countryName(order.country)} · ${categoryLabel(order.category)} · paid placement`.slice(0, 250));
  p.set("success_url", `${SITE_URL}/checkout/done?order=${order.id}`);
  p.set("cancel_url", `${SITE_URL}/claim`);
  if (order.email) p.set("customer_email", order.email);
  const res = await fetch(`${API}/checkout/sessions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded", "idempotency-key": `order-${order.id}` },
    body: p,
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !j.url) throw new Error(j.error?.message || "Could not start checkout.");
  return j.url;
}

/** Verifies Stripe's `Stripe-Signature` header (HMAC-SHA256 over `${timestamp}.${body}`) with a 5 minute tolerance. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string | undefined, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(nowSec - t) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const candidates = header.split(",").filter((kv) => kv.startsWith("v1=")).map((kv) => kv.slice(3));
  return candidates.some((c) => c.length === expected.length && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(expected)));
}
