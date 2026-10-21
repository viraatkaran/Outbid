import crypto from "node:crypto";
import type { Order } from "./listings";

/**
 * Payment provider boundary. Only "mock" (test mode, no real money) is implemented.
 * To go live, add a provider here (Paddle / Lemon Squeezy / Stripe): create a hosted checkout for the order,
 * set the order id in the provider's custom data, and call fulfillOrder() from the provider's verified webhook.
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
  throw new Error(`Payment provider "${providerName()}" is not implemented yet.`);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || secret === "change-me" || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
