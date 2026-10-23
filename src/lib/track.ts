import crypto from "node:crypto";
import { db, nowIso } from "./db";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|fetch|curl|wget|python-requests|httpclient|headless|lighthouse|monitor|scrapy|go-http|java\/|axios|node-fetch/i;
export const isBot = (ua: string | null) => !ua || BOT_RE.test(ua);

export function visitorHash(ip: string, ua: string, day: string) {
  return crypto.createHmac("sha256", process.env.HASH_SECRET || "dev-secret").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 32);
}

export function refHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try { return new URL(referrer).hostname.replace(/^www\./, "").slice(0, 100); } catch { return null; }
}

/**
 * Records an outbound click. Every click is stored; only the first non-bot click per visitor
 * per listing per day is marked verified (enforced by a unique index).
 */
export function recordClick(opts: { listingId: number; ip: string; ua: string | null; referrer: string | null; country: string | null }) {
  const day = new Date().toISOString().slice(0, 10);
  const hash = visitorHash(opts.ip, opts.ua ?? "", day);
  const d = db();
  const insert = (verified: number) =>
    d.prepare(
      "INSERT INTO clicks (listing_id, day, visitor_hash, referrer, country, verified, created_at) VALUES (?,?,?,?,?,?,?)",
    ).run(opts.listingId, day, hash, refHost(opts.referrer), opts.country?.slice(0, 2).toUpperCase() ?? null, verified, nowIso());
  if (isBot(opts.ua)) return insert(0);
  try {
    insert(1);
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") insert(0);
    else throw e;
  }
}

export function listingAnalytics(listingId: number) {
  const d = db();
  const days = d.prepare(
    `SELECT day, SUM(verified) AS verified, COUNT(*) AS raw FROM clicks
     WHERE listing_id = ? AND day >= date('now','-13 days') GROUP BY day ORDER BY day`,
  ).all(listingId) as { day: string; verified: number; raw: number }[];
  const referrers = d.prepare(
    `SELECT COALESCE(referrer,'direct') AS name, COUNT(*) AS n FROM clicks WHERE listing_id=? AND verified=1 GROUP BY name ORDER BY n DESC LIMIT 8`,
  ).all(listingId) as { name: string; n: number }[];
  const countries = d.prepare(
    `SELECT COALESCE(country,'??') AS name, COUNT(*) AS n FROM clicks WHERE listing_id=? AND verified=1 GROUP BY name ORDER BY n DESC LIMIT 8`,
  ).all(listingId) as { name: string; n: number }[];
  const totals = d.prepare(
    `SELECT COALESCE(SUM(verified),0) AS verified, COUNT(*) AS raw FROM clicks WHERE listing_id=?`,
  ).get(listingId) as { verified: number; raw: number };
  const spent = (d.prepare("SELECT COALESCE(SUM(amount_cents),0) AS n FROM bids WHERE listing_id=?").get(listingId) as { n: number }).n;
  const bids = d.prepare("SELECT amount_cents, scope, created_at FROM bids WHERE listing_id=? ORDER BY id DESC LIMIT 20").all(listingId) as { amount_cents: number; scope: string; created_at: string }[];
  return { days, referrers, countries, totals, spent, bids };
}
