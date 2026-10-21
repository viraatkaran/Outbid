import dns from "node:dns/promises";
import net from "node:net";

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const l = ip.toLowerCase();
  return l === "::1" || l === "::" || l.startsWith("fe80") || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("::ffff:");
}

async function assertPublicHost(host: string) {
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked host");
}

function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i");
    const m = html.match(re1) || html.match(re2);
    if (m?.[1]) return decode(m[1]);
  }
  return null;
}

function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

/** Best-effort title/description lookup. SSRF-guarded: public hosts only, bounded time and size, manual redirects. */
export async function fetchMetadata(url: string, domain: string): Promise<{ title: string; description: string }> {
  const fallback = { title: domain, description: "" };
  try {
    let current = url;
    for (let hop = 0; hop < 3; hop++) {
      const u = new URL(current);
      await assertPublicHost(u.hostname);
      const res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(4000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; RankBot/1.0)", accept: "text/html" },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, current).toString();
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") || "").includes("html")) return fallback;
      const reader = res.body?.getReader();
      if (!reader) return fallback;
      let html = "";
      const dec = new TextDecoder();
      while (html.length < 200_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (html.includes("</head>")) break;
      }
      reader.cancel().catch(() => {});
      const title = meta(html, ["og:title", "twitter:title"]) || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
      const description = meta(html, ["og:description", "description", "twitter:description"]) || "";
      return { title: (title || domain).slice(0, 120), description: description.slice(0, 220) };
    }
  } catch {
    /* fall through */
  }
  return fallback;
}
