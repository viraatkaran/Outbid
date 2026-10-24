import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { siteOrigin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

/** Starts Google sign-in. Also asks for read-only Search Console access so the dashboard can show search data. */
export async function GET() {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return NextResponse.redirect(`${siteOrigin()}/admin/login?error=not_configured`);
  const state = crypto.randomBytes(16).toString("hex");
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: id, redirect_uri: `${siteOrigin()}/api/auth/google/callback`, response_type: "code",
    scope: "openid email https://www.googleapis.com/auth/webmasters.readonly",
    access_type: "offline", prompt: "consent", state,
  }).toString();
  const res = NextResponse.redirect(u);
  res.cookies.set("br_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
