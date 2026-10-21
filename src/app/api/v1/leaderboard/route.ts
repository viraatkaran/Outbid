import { NextResponse } from "next/server";
import { SITE_URL, isCategory } from "../../../../lib/config";
import { getBoard, isPeriod } from "../../../../lib/rank";

export const dynamic = "force-dynamic";

/** Public leaderboard JSON: ?period=all|month|week|today&category=slug&limit=1..100 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = u.searchParams.get("period") ?? "all";
  const c = u.searchParams.get("category");
  const limit = Math.min(100, Math.max(1, Number(u.searchParams.get("limit")) || 10));
  const rows = getBoard({ period: isPeriod(p) ? p : "all", category: c && isCategory(c) ? c : null, limit });
  return NextResponse.json(
    { paid_placement: true, items: rows.map((r, i) => ({
      rank: i + 1, title: r.title, domain: r.domain, category: r.category, total_usd: r.total_cents / 100,
      verified_clicks: r.clicks, profile: `${SITE_URL}/l/${r.slug}`,
    })) },
    { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } },
  );
}
