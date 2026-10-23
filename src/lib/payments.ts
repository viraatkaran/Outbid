import crypto from "node:crypto";
import type { Order } from "./listings";
import { createStripeCheckout } from "./stripe";

/**
 * Payment provider boundary. "stripe" creates a hosted Stripe Checkout page and is fulfilled by /api/webhooks/stripe.
 * "mock" is a test mode with no real money. Selected with PAYMENT_PROVIDER.
 */
export function providerName() {
  return process.env.PAYMENT_PROVIDER || "mock";
}

export function mockAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "1";
}

export async function createCheckout(order: Order): Promise<{ url: string }> {
  if (providerName() === "mock") {
    if (!mockAllowed()) throw new Error("Payments are not configured.");
    return { url: `/checkout/${order.id}` };
  }
  if (providerName() === "stripe") return { url: await createStripeCheckout(order) };
  throw new Error(`Payment provider "${providerName()}" is not implemented.`);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || secret === "change-me" || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
