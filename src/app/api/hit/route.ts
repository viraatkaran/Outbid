import { NextResponse } from "next/server";
import { db, nowIso } from "../../../lib/db";
import { isBot, refHost, visitorHash } from "../../../lib/track";
import { clientIp, rateLimit } from "../../../lib/ratelimit";

export const dynamic = "force-dynamic";

/** First-party page view counter (called from the browser, so most bots never reach it). No raw IPs are stored. */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent");
  const ip = clientIp(req.headers);
  if (isBot(ua) || !rateLimit(`hit:${ip}`, 120, 60_000)) return new NextResponse(null, { status: 204 });
  let body: { path?: string; ref?: string } = {};
  try { body = await req.json(); } catch { return new NextResponse(null, { status: 204 }); }
  const path = String(body.path ?? "").split("?")[0].slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  let ref = refHost(body.ref ?? null);
  if (ref === "billboardrank.com") ref = null;
  const region = (req.headers.get("accept-language") ?? "").match(/-([A-Za-z]{2})\b/)?.[1]?.toUpperCase() ?? null;
  const device = /mobile|android|iphone|ipad/i.test(ua ?? "") ? "mobile" : "desktop";
  db().prepare("INSERT INTO pageviews (day, path, visitor_hash, referrer, lang_region, device, created_at) VALUES (?,?,?,?,?,?,?)")
    .run(day, path, visitorHash(ip, ua ?? "", day), ref, region, device, nowIso());
  return new NextResponse(null, { status: 204 });
}
