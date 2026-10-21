import net from "node:net";

export type NormalizedUrl = { url: string; domain: string };

/** Accepts "example.com", "https://example.com/x", or "@handle" (treated as an X profile). */
export function normalizeUrl(input: string): NormalizedUrl | null {
  let s = input.trim();
  if (!s || s.length > 300) return null;
  if (s.startsWith("@")) {
    const handle = s.slice(1);
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
    s = `https://x.com/${handle}`;
  } else if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s;
  }
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || net.isIP(host) || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (!/^[a-z0-9.-]+$/.test(host) && !host.startsWith("xn--") && !/^[\p{L}\p{N}.-]+$/u.test(host)) return null;
  const pathname = u.pathname.replace(/\/+$/, "");
  const domain = host.replace(/^www\./, "");
  return { url: `https://${domain}${pathname}`, domain };
}

export function slugFromDomain(domain: string) {
  return domain.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "listing";
}
