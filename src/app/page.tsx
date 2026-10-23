import Link from "next/link";
import ClaimForm from "../components/ClaimForm";
import BoardItem from "../components/BoardItem";
import Newsletter from "../components/Newsletter";
import PeriodTabs from "../components/PeriodTabs";
import { fmtUsd } from "../lib/config";
import { countryFlag, countryName, getCountry } from "../lib/countries";
import { getBoard, isPeriod, topCountries } from "../lib/rank";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams;
  const period = isPeriod(sp.period) ? sp.period : "all";
  const rows = getBoard({ scope: "world", period, limit: 100 });
  const today = getBoard({ scope: "world", period: "today", limit: 5 });
  const countries = topCountries(10);

  return (
    <main>
      <ClaimForm defaults={{ scope: "world" }} />

      <p className="hint">Starting prices shown are for high-income countries. Category and country levels cost less in many countries.</p>

      <h2 className="section">Worldwide top 100</h2>
      <PeriodTabs base="/" period={period} />
      <div className="grid">
        <section>
          {rows.length === 0 && <div className="card">The worldwide board is empty. Claim #1 above, or <Link href="/countries">browse by country</Link>.</div>}
          {rows.map((r, i) => <BoardItem key={r.id} row={r} rank={i + 1} />)}
        </section>
        <aside>
          <div className="box">
            <h4>Today's worldwide ranking</h4>
            {today.length === 0 && <div className="meta">No bids yet today.</div>}
            {today.map((r, i) => (
              <div className="mini" key={r.id}>
                <span>#{i + 1}</span><Link href={`/l/${r.slug}`}>{r.title.slice(0, 22)}</Link><span className="amt">{fmtUsd(r.total_cents)}</span>
              </div>
            ))}
          </div>
          <div className="box">
            <h4>Browse by country</h4>
            {countries.length === 0 && <div className="meta">Countries appear here once they have listings.</div>}
            <div className="chips">
              {countries.map((c) => {
                const k = getCountry(c.country);
                return k ? <Link key={c.country} className="chip" href={`/c/${k.slug}`}>{countryFlag(c.country)} {countryName(c.country)}<em>{c.listings}</em></Link> : null;
              })}
            </div>
            <p style={{ margin: "10px 0 0" }}><Link href="/countries">All countries and search →</Link></p>
          </div>
          <div className="box"><h4>Weekly top-10 email</h4><Newsletter source="home" /></div>
        </aside>
      </div>
    </main>
  );
}
