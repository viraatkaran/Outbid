import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fmtUsd } from "../../../lib/config";
import { getListingByToken } from "../../../lib/listings";
import { PERIODS, getRank } from "../../../lib/rank";
import { listingAnalytics } from "../../../lib/track";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your dashboard", robots: { index: false } };

export default async function Manage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const l = getListingByToken((await params).token);
  if (!l) notFound();
  const isNew = (await searchParams).new === "1";
  const a = listingAnalytics(l.id);
  const max = Math.max(1, ...a.days.map((d) => d.raw));
  const cpc = a.totals.verified ? a.spent / a.totals.verified : null;
  return (
    <main className="prose" style={{ maxWidth: 860 }}>
      {isNew && <div className="card">🎉 <strong>You're listed!</strong> Bookmark this private link: it is the only way to see your dashboard.</div>}
      <h1>{l.title}</h1>
      <p><a href={`/l/${l.slug}`}>Public page</a> · <a href="/">Raise your rank</a></p>
      <div className="card">
        <table><tbody>
          {PERIODS.map((p) => { const r = getRank(l.id, p.key); return <tr key={p.key}><th>{p.label}</th><td>{r ? `#${r.rank} of ${r.total}` : "not ranked"}</td></tr>; })}
          <tr><th>Total spent</th><td>{fmtUsd(a.spent)}</td></tr>
          <tr><th>Verified clicks</th><td>{a.totals.verified} <span className="meta">(raw {a.totals.raw}, incl. bots and repeats)</span></td></tr>
          <tr><th>Cost per verified click</th><td>{cpc === null ? "n/a" : fmtUsd(Math.round(cpc))}</td></tr>
        </tbody></table>
      </div>
      <div className="card">
        <h3>Clicks, last 14 days</h3>
        <div className="bars">{a.days.map((d) => <div key={d.day} title={`${d.day}: ${d.verified} verified / ${d.raw} raw`} style={{ height: `${(d.raw / max) * 100}%`, opacity: d.verified ? 1 : 0.35 }} />)}</div>
        {a.days.length === 0 && <p className="meta">No clicks yet.</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <div className="card"><h3>Top referrers</h3><table><tbody>{a.referrers.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.n}</td></tr>)}</tbody></table></div>
        <div className="card"><h3>Top countries</h3><table><tbody>{a.countries.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.n}</td></tr>)}</tbody></table></div>
      </div>
      <div className="card"><h3>Payment history</h3><table><tbody>{a.bids.map((b, i) => <tr key={i}><td>{b.created_at.slice(0, 16).replace("T", " ")}</td><td>{fmtUsd(b.amount_cents)}</td></tr>)}</tbody></table></div>
    </main>
  );
}
