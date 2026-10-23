import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RaiseForm, { type RaiseOption } from "../../../components/RaiseForm";
import SettingsForm from "../../../components/SettingsForm";
import { categoryLabel, fmtUsd } from "../../../lib/config";
import { countryFlag, countryName, getCountry } from "../../../lib/countries";
import { db } from "../../../lib/db";
import { getListingByToken } from "../../../lib/listings";
import { MIN_RAISE_CENTS, SCOPES, SCOPE_LABEL, floorCents, type Scope } from "../../../lib/pricing";
import { PERIODS, getBoardOrder, getRank, leaderTotal, type Board } from "../../../lib/rank";
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
  const country = getCountry(l.country);

  const boards: Record<Scope, Board> = {
    category: { scope: "category", country: l.country, category: l.category },
    country: { scope: "country", country: l.country },
    world: { scope: "world" },
  };
  const spentAt = (s: Scope) => (db().prepare("SELECT COALESCE(SUM(amount_cents),0) AS n FROM bids WHERE listing_id=? AND scope=?").get(l.id, s) as { n: number }).n;
  const rows = SCOPES.map((s) => {
    const rank = getRank(l.id, boards[s]);
    const order = getBoardOrder(boards[s]);
    const mine = order.find((r) => r.id === l.id)?.total ?? 0;
    const leader = leaderTotal(boards[s]);
    const paid = spentAt(s);
    const min = paid > 0 ? MIN_RAISE_CENTS : floorCents(s, l.country);
    const toLead = rank?.rank === 1 ? MIN_RAISE_CENTS : Math.max(0, leader - mine) + MIN_RAISE_CENTS;
    return { s, rank, paid, min, suggest: Math.max(min, toLead), toLead, leader };
  });
  const options: RaiseOption[] = rows.map((r) => ({
    scope: r.s, minCents: r.min, suggestCents: r.suggest,
    note: r.rank?.rank === 1 ? "You lead. Add more to stay ahead." : `About ${fmtUsd(r.toLead)} to reach #1`,
  }));

  return (
    <main className="prose" style={{ maxWidth: 860 }}>
      {isNew && <div className="card">🎉 <strong>You're listed!</strong> Bookmark this private link: it is the only way into your dashboard. {l.email ? "We also emailed it to you." : <>Add your email below so we can send it to you, and email you when you're outbid. Lost it later? <Link href="/recover">Get it again by email</Link>.</>}</div>}
      <h1>{l.title}</h1>
      <p><a href={`/l/${l.slug}`}>Public page</a> · {countryFlag(l.country)} {country ? <Link href={`/c/${country.slug}`}>{countryName(l.country)}</Link> : l.country} · {country ? <Link href={`/c/${country.slug}/${l.category}`}>{categoryLabel(l.category)}</Link> : categoryLabel(l.category)}</p>

      <div className="card">
        <h3>Your ranks</h3>
        <table><thead><tr><th>Level</th><th>Rank</th><th>You paid</th><th>Leader paid</th></tr></thead><tbody>
          {rows.map((r) => (
            <tr key={r.s}>
              <td>{SCOPE_LABEL[r.s]}{r.s === "world" ? "" : r.s === "country" ? ` · ${countryName(l.country)}` : ` · ${categoryLabel(l.category)}`}</td>
              <td>{r.rank ? `#${r.rank.rank} of ${r.rank.ofCount}` : "not ranked"}</td>
              <td>{fmtUsd(r.paid)}</td>
              <td>{r.leader ? fmtUsd(r.leader) : "none yet"}</td>
            </tr>
          ))}
          {PERIODS.filter((p) => p.key !== "all").map((p) => {
            const r = getRank(l.id, boards.category, p.key);
            return <tr key={p.key}><td>{p.label} · category</td><td colSpan={3}>{r ? `#${r.rank} of ${r.ofCount}` : "not ranked"}</td></tr>;
          })}
        </tbody></table>
        <p className="meta">A payment counts on its own level and every level below it: worldwide payments also count on your country and category boards.</p>
      </div>

      <div className="card">
        <h3>Raise your rank</h3>
        <RaiseForm url={l.url} options={options} />
      </div>

      <div className="card">
        <h3>Performance</h3>
        <table><tbody>
          <tr><th>Total spent</th><td>{fmtUsd(a.spent)}</td></tr>
          <tr><th>Verified clicks</th><td>{a.totals.verified} <span className="meta">(raw {a.totals.raw}, incl. bots and repeats)</span></td></tr>
          <tr><th>Cost per verified click</th><td>{cpc === null ? "n/a" : fmtUsd(Math.round(cpc))}</td></tr>
        </tbody></table>
        <h3>Clicks, last 14 days</h3>
        <div className="bars">{a.days.map((d) => <div key={d.day} title={`${d.day}: ${d.verified} verified / ${d.raw} raw`} style={{ height: `${(d.raw / max) * 100}%`, opacity: d.verified ? 1 : 0.35 }} />)}</div>
        {a.days.length === 0 && <p className="meta">No clicks yet.</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <div className="card"><h3>Top referrers</h3><table><tbody>{a.referrers.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.n}</td></tr>)}</tbody></table></div>
        <div className="card"><h3>Top countries of visitors</h3><table><tbody>{a.countries.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.n}</td></tr>)}</tbody></table></div>
      </div>

      <div className="card">
        <h3>Email and alerts</h3>
        <SettingsForm token={l.owner_token} email={l.email ?? ""} alerts={!!l.alerts} />
      </div>
      <div className="card"><h3>Payment history</h3><table><tbody>{a.bids.map((b, i) => <tr key={i}><td>{b.created_at.slice(0, 16).replace("T", " ")}</td><td>{SCOPE_LABEL[b.scope as Scope] ?? b.scope}</td><td>{fmtUsd(b.amount_cents)}</td></tr>)}</tbody></table></div>
    </main>
  );
}
