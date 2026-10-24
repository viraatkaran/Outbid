import { NextResponse } from "next/server";
import { db, nowIso } from "../../../lib/db";
import { esc, layout, sendEmail } from "../../../lib/email";
import { clientIp, rateLimit } from "../../../lib/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req.headers)}`, 5, 3_600_000)) return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const name = String(b?.name ?? "").trim().slice(0, 100);
  const email = String(b?.email ?? "").trim().toLowerCase().slice(0, 200);
  const message = String(b?.message ?? "").trim().slice(0, 4000);
  if (b?.website) return NextResponse.json({ ok: true }); // honeypot field, only bots fill it in
  if (!name || message.length < 10 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Please fill in your name, a valid email and a message." }, { status: 400 });
  db().prepare("INSERT INTO messages (name, email, message, created_at) VALUES (?,?,?,?)").run(name, email, message, nowIso());
  const admin = process.env.ADMIN_EMAIL;
  if (admin) {
    void sendEmail(admin, `Contact form: ${name}`, layout({ heading: "New message", bodyHtml: `<p><b>${esc(name)}</b> (${esc(email)}) wrote:</p><p style="white-space:pre-wrap">${esc(message)}</p><p>Reply to this person directly at ${esc(email)}.</p>` })).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
