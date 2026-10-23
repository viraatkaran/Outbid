import { NextResponse } from "next/server";
import { SITE_URL, isCategory } from "../../../../lib/config";
import { getCountry, isCountryCode } from "../../../../lib/countries";
import { getBoard, isPeriod } from "../../../../lib/rank";

export const dynamic = "force-dynamic";

/** Public leaderboard JSON: ?scope=world|country|category&country=NZ&category=plumbing&period=all|month|week|today&limit=1..100 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = u.searchParams.get("period") ?? "all";
  const country = (u.searchParams.get("country") ?? "").toUpperCase();
  const category = u.searchParams.get("category") ?? "";
  const hasCountry = isCountryCode(country);
  const scope = hasCountry && isCategory(category) ? "category" : hasCountry ? "country" : "world";
  const limit = Math.min(100, Math.max(1, Number(u.searchParams.get("limit")) || 10));
  const rows = getBoard({
    scope, country: hasCountry ? country : null, category: scope === "category" ? category : null,
    period: isPeriod(p) ? p : "all", limit,
  });
  return NextResponse.json(
    { paid_placement: true, board: { scope, country: hasCountry ? country : null, category: scope === "category" ? category : null },
      items: rows.map((r, i) => ({
        rank: i + 1, title: r.title, domain: r.domain, category: r.category, country: r.country, country_name: getCountry(r.country)?.name,
        total_usd: r.total_cents / 100, verified_clicks: r.clicks, profile: `${SITE_URL}/l/${r.slug}`,
      })) },
    { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } },
  );
}
