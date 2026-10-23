import { NextResponse } from "next/server";
import { isCategory } from "../../../lib/config";
import { isCountryCode } from "../../../lib/countries";
import { floorCents } from "../../../lib/pricing";
import { leaderTotal } from "../../../lib/rank";

export const dynamic = "force-dynamic";

/** Starting prices and current leader totals for each level, for the claim form. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const country = (u.searchParams.get("country") ?? "").toUpperCase();
  const category = u.searchParams.get("category") ?? "";
  const c = isCountryCode(country) ? country : null;
  const k = isCategory(category) ? category : null;
  return NextResponse.json({
    floors: { category: floorCents("category", c), country: floorCents("country", c), world: floorCents("world", c) },
    leaders: {
      category: c && k ? leaderTotal({ scope: "category", country: c, category: k }) : 0,
      country: c ? leaderTotal({ scope: "country", country: c }) : 0,
      world: leaderTotal({ scope: "world" }),
    },
  });
}
