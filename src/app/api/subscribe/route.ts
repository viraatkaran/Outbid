import { NextResponse } from "next/server";
import { db, nowIso } from "../../../lib/db";
import { clientIp, rateLimit } from "../../../lib/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit(`sub:${clientIp(req.headers)}`, 5, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  db().prepare("INSERT OR IGNORE INTO subscribers (email, source, created_at) VALUES (?,?,?)").run(email, String(b?.source ?? "site").slice(0, 30), nowIso());
  return NextResponse.json({ ok: true });
}
