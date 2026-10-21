import { NextResponse } from "next/server";
import { db, nowIso } from "../../../lib/db";
import { getListingBySlug } from "../../../lib/listings";
import { clientIp, rateLimit } from "../../../lib/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit(`rep:${clientIp(req.headers)}`, 5, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const l = getListingBySlug(String(b?.slug ?? ""));
  const reason = String(b?.reason ?? "").trim().slice(0, 500);
  if (!l || !reason) return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  db().prepare("INSERT INTO reports (listing_id, reason, created_at) VALUES (?,?,?)").run(l.id, reason, nowIso());
  return NextResponse.json({ ok: true });
}
