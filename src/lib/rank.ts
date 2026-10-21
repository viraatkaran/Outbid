import { db } from "./db";

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

export type BoardRow = {
  id: number; slug: string; url: string; domain: string; title: string; description: string;
  category: string; total_cents: number; clicks: number; created_at: string;
};

/**
 * Ranking rule (published on /rules): rank by total paid in the period.
 * Ties go to whoever reached that total first (lower id of their latest bid).
 */
export function getBoard(opts: { period: Period; category?: string | null; limit?: number; offset?: number }): BoardRow[] {
  const start = periodStart(opts.period);
  return db()
    .prepare(
      `SELECT l.id, l.slug, l.url, l.domain, l.title, l.description, l.category, l.created_at,
              SUM(b.amount_cents) AS total_cents, MAX(b.id) AS last_bid,
              (SELECT COUNT(*) FROM clicks c WHERE c.listing_id = l.id AND c.verified = 1) AS clicks
       FROM listings l JOIN bids b ON b.listing_id = l.id
       WHERE l.status = 'active' AND (@start IS NULL OR b.created_at >= @start) AND (@cat IS NULL OR l.category = @cat)
       GROUP BY l.id
       ORDER BY total_cents DESC, last_bid ASC
       LIMIT @limit OFFSET @offset`,
    )
    .all({ start, cat: opts.category ?? null, limit: opts.limit ?? 50, offset: opts.offset ?? 0 }) as BoardRow[];
}

export function getRank(listingId: number, period: Period, category?: string | null): { rank: number; total: number } | null {
  const start = periodStart(period);
  const rows = db()
    .prepare(
      `SELECT l.id FROM listings l JOIN bids b ON b.listing_id = l.id
       WHERE l.status = 'active' AND (@start IS NULL OR b.created_at >= @start) AND (@cat IS NULL OR l.category = @cat)
       GROUP BY l.id ORDER BY SUM(b.amount_cents) DESC, MAX(b.id) ASC`,
    )
    .all({ start, cat: category ?? null }) as { id: number }[];
  const i = rows.findIndex((r) => r.id === listingId);
  return i < 0 ? null : { rank: i + 1, total: rows.length };
}

export function leaderTotal(period: Period, category?: string | null): number {
  return getBoard({ period, category, limit: 1 })[0]?.total_cents ?? 0;
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
