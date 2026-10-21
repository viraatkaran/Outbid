import { BRAND, SITE_URL } from "../../lib/config";
import { getPosts } from "../../lib/blog";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const items = getPosts().map((p) => `<item><title>${esc(p.title)}</title><link>${SITE_URL}/blog/${p.slug}</link><guid>${SITE_URL}/blog/${p.slug}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join("");
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>${esc(BRAND)}</title><link>${SITE_URL}</link><description>AI tools &amp; SaaS leaderboard blog</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
