import crypto from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "br_admin";
const MAX_AGE_S = 60 * 60 * 24 * 7;
const secret = () => process.env.SESSION_SECRET || "dev-session-secret";

export const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "19101989karan@gmail.com,codebluepulse@gmail.com,nzaucklandkaran@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export const isAllowed = (email: string) => adminEmails().includes(email.trim().toLowerCase());

const mac = (payload: string) => crypto.createHmac("sha256", secret()).update(payload).digest("base64url");

export function signSession(email: string): string {
  const payload = Buffer.from(JSON.stringify({ e: email.toLowerCase(), x: Date.now() + MAX_AGE_S * 1000 })).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = Buffer.from(mac(payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; x: number };
    return x > Date.now() && isAllowed(e) ? e : null;
  } catch { return null; }
}

/** Email of the signed-in admin, or null. */
export async function currentAdmin(): Promise<string | null> {
  return verifySession((await cookies()).get(COOKIE)?.value);
}

export const sessionCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: MAX_AGE_S };

/** For route handlers that receive a Request. */
export function adminFromRequest(req: Request): string | null {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return verifySession(m?.[1]);
}

export const siteOrigin = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
