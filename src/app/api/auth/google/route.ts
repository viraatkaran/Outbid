import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { adminFromRequest, siteOrigin } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * Starts Google sign-in (email only). With ?gsc=1 and an existing admin session it instead asks for read-only
 * Search Console access, so a problem with that permission can never block signing in.
 */
export async function GET(req: NextRequest) {
  const gsc = req.nextUrl.searchParams.get("gsc") === "1";
  if (gsc && !adminFromRequest(req)) return NextResponse.redirect(`${siteOrigin()}/admin/login`);
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return NextResponse.redirect(`${siteOrigin()}/admin/login?error=not_configured`);
  const state = crypto.randomBytes(16).toString("hex");
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: id, redirect_uri: `${siteOrigin()}/api/auth/google/callback`, response_type: "code",
    scope: gsc ? "https://www.googleapis.com/auth/webmasters.readonly" : "openid email",
    ...(gsc ? { access_type: "offline", prompt: "consent" } : {}), state,
  }).toString();
  const res = NextResponse.redirect(u);
  res.cookies.set("br_oauth_state", `${state}:${gsc ? 1 : 0}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
