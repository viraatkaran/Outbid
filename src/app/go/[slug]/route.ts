import { NextResponse } from "next/server";
import { getListingBySlug } from "../../../lib/listings";
import { clientIp } from "../../../lib/ratelimit";
import { recordClick } from "../../../lib/track";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getListingBySlug(slug);
  if (!l || l.status !== "active") return NextResponse.redirect(new URL("/", req.url), 302);
  recordClick({
    listingId: l.id, ip: clientIp(req.headers), ua: req.headers.get("user-agent"), referrer: req.headers.get("referer"),
    country: req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry"),
  });
  const dest = new URL(l.url);
  dest.searchParams.set("utm_source", new URL(req.url).hostname);
  dest.searchParams.set("utm_medium", "leaderboard");
  return NextResponse.redirect(dest, 302);
}
