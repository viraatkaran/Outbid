import { NextResponse } from "next/server";
import { sendDashboardLinks } from "../../../lib/notify";
import { clientIp, rateLimit } from "../../../lib/ratelimit";

/** Emails dashboard links to the address saved on a listing. Always answers the same, so it can't be used to probe addresses. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  if (!rateLimit(`rec-ip:${clientIp(req.headers)}`, 5, 3_600_000) || !rateLimit(`rec:${email}`, 3, 3_600_000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  void sendDashboardLinks(email).catch((e) => console.error("[recover]", e));
  return NextResponse.json({ ok: true });
}
