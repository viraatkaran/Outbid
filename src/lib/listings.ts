import crypto from "node:crypto";
import { db, nowIso } from "./db";
import { MAX_BID_CENTS, isCategory } from "./config";
import { isCountryCode } from "./countries";
import { MIN_RAISE_CENTS, SCOPES, floorCents, type Scope } from "./pricing";
import { normalizeUrl, slugFromDomain } from "./url";
import { fetchMetadata } from "./metadata";

export type Listing = {
  id: number; slug: string; url: string; domain: string; title: string; description: string;
  category: string; country: string; owner_token: string; email: string | null; alerts: number; status: string; created_at: string;
};

export const getListingBySlug = (slug: string) =>
  db().prepare("SELECT * FROM listings WHERE slug = ?").get(slug) as Listing | undefined;
export const getListingByToken = (token: string) =>
  db().prepare("SELECT * FROM listings WHERE owner_token = ?").get(token) as Listing | undefined;
export const getListingByUrl = (url: string) =>
  db().prepare("SELECT * FROM listings WHERE url = ?").get(url) as Listing | undefined;

export type OrderInput = { urlInput: string; category: string; country: string; scope: Scope; amountCents: number; email?: string | null };

export class ValidationError extends Error {}

/** Validates input, looks up site metadata (new listings only) and creates a pending order. */
export async function createOrder(input: OrderInput) {
  const n = normalizeUrl(input.urlInput);
  if (!n) throw new ValidationError("Enter a valid public website URL or @handle.");
  if (!Number.isInteger(input.amountCents) || input.amountCents > MAX_BID_CENTS)
    throw new ValidationError("Invalid amount.");
  if (!SCOPES.includes(input.scope)) throw new ValidationError("Choose a ranking level.");
  const existing = getListingByUrl(n.url);
  if (existing?.status === "hidden") throw new ValidationError("This listing is not available.");
  const category = existing ? existing.category : input.category;
  const country = existing ? existing.country : input.country;
  if (!isCountryCode(country)) throw new ValidationError("Choose a country.");
  if (!isCategory(category)) throw new ValidationError("Choose a category.");
  const paidAtScope = existing
    ? (db().prepare("SELECT COUNT(*) AS n FROM bids WHERE listing_id = ? AND scope = ?").get(existing.id, input.scope) as { n: number }).n
    : 0;
  const min = paidAtScope > 0 ? MIN_RAISE_CENTS : floorCents(input.scope, country);
  if (input.amountCents < min) throw new ValidationError(`The minimum for this level is $${min / 100}.`);
  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ValidationError("Invalid email.");

  const meta = existing ? { title: existing.title, description: existing.description } : await fetchMetadata(n.url, n.domain);
  const id = crypto.randomUUID();
  db()
    .prepare(
      `INSERT INTO orders (id, listing_id, url, domain, title, description, category, country, scope, amount_cents, email, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(id, existing?.id ?? null, n.url, n.domain, meta.title, meta.description, category, country, input.scope, input.amountCents, email, nowIso());
  return { orderId: id, existing: !!existing };
}

export type Order = {
  id: string; listing_id: number | null; url: string; domain: string; title: string; description: string;
  category: string; country: string; scope: Scope; amount_cents: number; email: string | null; created_listing: number; status: string; created_at: string;
};
export const getOrder = (id: string) => db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as Order | undefined;

/**
 * Marks an order paid and records the bid. Idempotent: a repeated payment_ref or an already-paid order
 * returns the original result without adding a second bid.
 */
export type Fulfilled = { listingId: number; slug: string; ownerToken: string; created: boolean };

export function fulfillOrder(orderId: string, paymentRef: string): Fulfilled {
  const d = db();
  const tx = d.transaction(() => {
    const order = getOrder(orderId);
    if (!order) throw new ValidationError("Unknown order.");
    let listing = order.listing_id
      ? (d.prepare("SELECT * FROM listings WHERE id = ?").get(order.listing_id) as Listing)
      : getListingByUrl(order.url);
    if (order.status === "paid" && listing) return { listingId: listing.id, slug: listing.slug, ownerToken: listing.owner_token, created: false };

    let created = false;
    if (!listing) {
      let slug = slugFromDomain(order.domain);
      if (getListingBySlug(slug)) slug += "-" + crypto.randomBytes(2).toString("hex");
      const token = crypto.randomBytes(24).toString("hex");
      const info = d
        .prepare(
          `INSERT INTO listings (slug, url, domain, title, description, category, country, owner_token, email, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(slug, order.url, order.domain, order.title, order.description, order.category, order.country, token, order.email, nowIso());
      listing = d.prepare("SELECT * FROM listings WHERE id = ?").get(info.lastInsertRowid) as Listing;
      created = true;
    }
    d.prepare("INSERT INTO bids (listing_id, amount_cents, scope, payment_ref, created_at) VALUES (?,?,?,?,?)").run(
      listing.id, order.amount_cents, order.scope, paymentRef, nowIso(),
    );
    d.prepare("UPDATE orders SET status='paid', listing_id=?, created_listing=? WHERE id=?").run(listing.id, created ? 1 : 0, order.id);
    return { listingId: listing.id, slug: listing.slug, ownerToken: listing.owner_token, created };
  });
  return tx();
}
