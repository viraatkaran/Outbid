import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, isAllowed, sessionCookieOptions, signSession, siteOrigin } from "../../../../../lib/adminAuth";
import { db, nowIso } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

const back = (error: string) => NextResponse.redirect(`${siteOrigin()}/admin/login?error=${error}`);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("br_oauth_state")?.value) return back("state");
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${siteOrigin()}/api/auth/google/callback`, grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return back("token");
  const tok = (await tokenRes.json()) as { id_token?: string; refresh_token?: string; scope?: string };
  // The id_token came straight from Google over TLS in exchange for our one-time code, so its claims can be trusted.
  let claims: { email?: string; email_verified?: boolean; aud?: string; iss?: string };
  try { claims = JSON.parse(Buffer.from((tok.id_token ?? "").split(".")[1] ?? "", "base64url").toString()); } catch { return back("token"); }
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID || !/^https:\/\/accounts\.google\.com$|^accounts\.google\.com$/.test(claims.iss ?? "")) return back("token");
  const email = (claims.email ?? "").toLowerCase();
  if (!claims.email_verified || !isAllowed(email)) return back("denied");
  // Keep the Search Console refresh token, but only if the admin actually granted that permission.
  if (tok.refresh_token && (tok.scope ?? "").includes("webmasters.readonly")) {
    db().prepare("INSERT INTO kv (key, value, updated_at) VALUES ('gsc_refresh_token', ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at")
      .run(tok.refresh_token, nowIso());
    db().prepare("INSERT INTO kv (key, value, updated_at) VALUES ('gsc_connected_by', ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at")
      .run(email, nowIso());
  }
  const res = NextResponse.redirect(`${siteOrigin()}/admin`);
  res.cookies.set(COOKIE, signSession(email), sessionCookieOptions);
  res.cookies.delete("br_oauth_state");
  return res;
}
