import { db } from "./db";
import type { Scope } from "./pricing";

export type Period = "all" | "today" | "week" | "month";
export const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "All-time" },
  { key: "month", label: "This month" },
  { key: "week", label: "This week" },
  { key: "today", label: "Today" },
];
export const isPeriod = (s: string | undefined): s is Period => PERIODS.some((p) => p.key === s);

/** Start of the period (UTC) as an ISO string, or null for all-time. Weeks start on Monday. */
export function periodStart(p: Period, now = new Date()): string | null {
  if (p === "all") return null;
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (p === "week") d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  if (p === "month") d.setUTCDate(1);
  return d.toISOString();
}

/**
 * A payment made at one level also counts on every board below it:
 *  - category board: category, country and world payments
 *  - country board:  country and world payments
 *  - world board:    world payments only
 */
export const COUNTED: Record<Scope, Scope[]> = {
  category: ["category", "country", "world"],
  country: ["country", "world"],
  world: ["world"],
};

export type Board = { scope: Scope; country?: string | null; category?: string | null };
export const BOARD_LIMIT = 100;

export const boardKey = (b: Board) => `${b.scope}:${b.country ?? "-"}:${b.category ?? "-"}`;

export type BoardRow = {
  id: number; slug: string; url: string; domain: string; title: string; description: string;
  category: string; country: string; total_cents: number; clicks: number; created_at: string;
};

function filters(b: Board) {
  return {
    country: b.scope === "world" ? null : (b.country ?? null),
    cat: b.scope === "category" ? (b.category ?? null) : null,
  };
}

const likeEscape = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;

/**
 * Ranking rule (published on /rules): rank by total paid in the period on payments that count for the board.
 * Ties go to whoever reached that total first (lower id of their latest bid).
 */
export function getBoard(opts: Board & { period: Period; q?: string | null; limit?: number; offset?: number }): BoardRow[] {
  const start = periodStart(opts.period);
  const f = filters(opts);
  const scopes = COUNTED[opts.scope].map((s) => `'${s}'`).join(",");
  const q = opts.q?.trim() ? likeEscape(opts.q.trim().slice(0, 60)) : null;
  return db()
    .prepare(
      `SELECT l.id, l.slug, l.url, l.domain, l.title, l.description, l.category, l.country, l.created_at,
              SUM(b.amount_cents) AS total_cents, MAX(b.id) AS last_bid,
              (SELECT COUNT(*) FROM clicks c WHERE c.listing_id = l.id AND c.verified = 1) AS clicks
       FROM listings l JOIN bids b ON b.listing_id = l.id
       WHERE l.status = 'active' AND b.scope IN (${scopes})
         AND (@start IS NULL OR b.created_at >= @start)
         AND (@country IS NULL OR l.country = @country)
         AND (@cat IS NULL OR l.category = @cat)
         AND (@q IS NULL OR l.title LIKE @q ESCAPE '\\' OR l.domain LIKE @q ESCAPE '\\')
       GROUP BY l.id
       ORDER BY total_cents DESC, last_bid ASC
       LIMIT @limit OFFSET @offset`,
    )
    .all({ start, country: f.country, cat: f.cat, q, limit: Math.min(opts.limit ?? BOARD_LIMIT, BOARD_LIMIT), offset: opts.offset ?? 0 }) as BoardRow[];
}

/** Every listing on a board in rank order (no cap), used for ranks and outbid detection. */
export function getBoardOrder(b: Board, period: Period = "all"): { id: number; total: number }[] {
  const start = periodStart(period);
  const f = filters(b);
  const scopes = COUNTED[b.scope].map((s) => `'${s}'`).join(",");
  return db()
    .prepare(
      `SELECT l.id AS id, SUM(b.amount_cents) AS total FROM listings l JOIN bids b ON b.listing_id = l.id
       WHERE l.status = 'active' AND b.scope IN (${scopes})
         AND (@start IS NULL OR b.created_at >= @start)
         AND (@country IS NULL OR l.country = @country)
         AND (@cat IS NULL OR l.category = @cat)
       GROUP BY l.id ORDER BY total DESC, MAX(b.id) ASC`,
    )
    .all({ start, country: f.country, cat: f.cat }) as { id: number; total: number }[];
}

export function getRank(listingId: number, b: Board, period: Period = "all"): { rank: number; total: number; ofCount: number } | null {
  const rows = getBoardOrder(b, period);
  const i = rows.findIndex((r) => r.id === listingId);
  return i < 0 ? null : { rank: i + 1, total: rows[i].total, ofCount: rows.length };
}

export function leaderTotal(b: Board, period: Period = "all"): number {
  return getBoard({ ...b, period, limit: 1 })[0]?.total_cents ?? 0;
}

export type ListingForRanks = { id: number; country: string; category: string };

export function listingRanks(l: ListingForRanks, period: Period = "all") {
  return {
    category: getRank(l.id, { scope: "category", country: l.country, category: l.category }, period),
    country: getRank(l.id, { scope: "country", country: l.country }, period),
    world: getRank(l.id, { scope: "world" }, period),
  };
}

/** Countries with the most paid listings, for the home page. */
export function topCountries(limit = 12): { country: string; listings: number }[] {
  return db()
    .prepare(
      `SELECT l.country AS country, COUNT(DISTINCT l.id) AS listings FROM listings l JOIN bids b ON b.listing_id = l.id
       WHERE l.status = 'active' GROUP BY l.country ORDER BY listings DESC, SUM(b.amount_cents) DESC LIMIT ?`,
    )
    .all(limit) as { country: string; listings: number }[];
}

export function categoryCounts(country: string): Record<string, number> {
  const rows = db()
    .prepare("SELECT category, COUNT(*) AS n FROM listings WHERE status = 'active' AND country = ? AND id IN (SELECT listing_id FROM bids) GROUP BY category")
    .all(country) as { category: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}

export function countryListingCounts(): Record<string, number> {
  const rows = db()
    .prepare("SELECT country, COUNT(*) AS n FROM listings WHERE status = 'active' AND id IN (SELECT listing_id FROM bids) GROUP BY country")
    .all() as { country: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.country, r.n]));
}

export function siteStats() {
  const d = db();
  const one = (sql: string) => (d.prepare(sql).get() as { n: number }).n;
  const today = periodStart("today")!;
  return {
    listings: one("SELECT COUNT(*) n FROM listings WHERE status='active'"),
    raisedCents: one("SELECT COALESCE(SUM(amount_cents),0) n FROM bids"),
    verifiedClicks: one("SELECT COUNT(*) n FROM clicks WHERE verified=1"),
    clicksToday: (d.prepare("SELECT COUNT(*) n FROM clicks WHERE verified=1 AND created_at>=?").get(today) as { n: number }).n,
  };
}
