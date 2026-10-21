import { BRAND, SITE_URL, fmtUsd, isCategory } from "../../lib/config";
import { getBoard, isPeriod } from "../../lib/rank";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboard widget", robots: { index: false } };

/** Embed: <iframe src="/embed?category=ai-agents&limit=5" width="320" height="360"></iframe> */
export default async function Embed({ searchParams }: { searchParams: Promise<{ category?: string; period?: string; limit?: string }> }) {
  const sp = await searchParams;
  const rows = getBoard({ period: isPeriod(sp.period) ? sp.period : "all", category: sp.category && isCategory(sp.category) ? sp.category : null, limit: Math.min(10, Number(sp.limit) || 5) });
  return (
    <main>
      <h4 style={{ margin: "8px 0" }}>{BRAND} leaderboard</h4>
      {rows.map((r, i) => (
        <div className="mini" key={r.id}>
          <span>#{i + 1}</span>
          <a href={`${SITE_URL}/l/${r.slug}`} target="_blank" rel="noopener">{r.title.slice(0, 30)}</a>
          <span className="amt">{fmtUsd(r.total_cents)}</span>
        </div>
      ))}
      <p className="meta"><a href={SITE_URL} target="_blank" rel="noopener">Claim your rank →</a></p>
    </main>
  );
}
