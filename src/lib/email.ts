import { db, nowIso } from "./db";
import { BRAND, SITE_URL } from "./config";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function layout(opts: { heading: string; bodyHtml: string; cta?: { url: string; label: string }; footerHtml?: string }) {
  const cta = opts.cta
    ? `<p style="margin:24px 0"><a href="${esc(opts.cta.url)}" style="background:#d81b60;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;display:inline-block">${esc(opts.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#fff9ef;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#161a33">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<div style="font-weight:900;font-size:22px;margin-bottom:18px">${esc(BRAND)}</div>
<div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #eadfcb">
<h1 style="font-size:20px;margin:0 0 12px">${esc(opts.heading)}</h1>${opts.bodyHtml}${cta}
</div>
<p style="color:#6a6f8f;font-size:12px;margin-top:16px">${opts.footerHtml ?? `Sent by <a href="${SITE_URL}" style="color:#6a6f8f">${esc(BRAND)}</a>. Rankings are paid placements.`}</p>
</div></body></html>`;
}

const stripTags = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "$2 ($1)").replace(/<br\s*\/?>/g, "\n").replace(/<\/p>/g, "\n\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

function record(to: string, subject: string, body: string, status: string, error?: string) {
  try {
    db().prepare("INSERT INTO outbox (to_email, subject, body, status, error, created_at) VALUES (?,?,?,?,?,?)").run(to, subject.slice(0, 200), body.slice(0, 4000), status, error ?? null, nowIso());
  } catch { /* the outbox is only a debugging aid */ }
}

/**
 * Sends through Resend when RESEND_API_KEY is set. Without it, emails are only written to the outbox
 * (visible on /admin) so the whole flow can be tested without sending anything.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const text = stripTags(html);
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    record(to, subject, text, "dry-run");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || `${BRAND} <onboarding@resend.dev>`, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      record(to, subject, text, "failed", `${res.status} ${(await res.text()).slice(0, 200)}`);
      return false;
    }
    record(to, subject, text, "sent");
    return true;
  } catch (e) {
    record(to, subject, text, "failed", (e as Error).message);
    return false;
  }
}
