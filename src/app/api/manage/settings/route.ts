import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { getListingByToken } from "../../../../lib/listings";
import { clientIp, rateLimit } from "../../../../lib/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit(`settings:${clientIp(req.headers)}`, 20, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const l = getListingByToken(String(b?.token ?? ""));
  if (!l) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const email = String(b?.email ?? "").trim().toLowerCase();
  if (email && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200)) return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  db().prepare("UPDATE listings SET email = ?, alerts = ? WHERE id = ?").run(email || null, b?.alerts ? 1 : 0, l.id);
  return NextResponse.json({ ok: true });
}
