import Link from "next/link";
import ClaimForm from "../components/ClaimForm";
import BoardItem from "../components/BoardItem";
import Newsletter from "../components/Newsletter";
import { CATEGORIES, categoryLabel, fmtUsd, isCategory } from "../lib/config";
import { PERIODS, getBoard, isPeriod, leaderTotal } from "../lib/rank";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ period?: string; cat?: string }> }) {
  const sp = await searchParams;
  const period = isPeriod(sp.period) ? sp.period : "all";
  const cat = sp.cat && isCategory(sp.cat) ? sp.cat : null;
  const rows = getBoard({ period, category: cat, limit: 100 });
  const today = getBoard({ period: "today", limit: 5 });
  const href = (p: string, c: string | null) => `/?period=${p}${c ? `&cat=${c}` : ""}`;

  return (
    <main>
      <ClaimForm categories={[...CATEGORIES]} leaderCents={leaderTotal(period, cat)} defaultCategory={cat ?? undefined} />
      <div className="tabs" aria-label="Period">
        {PERIODS.map((p) => <Link key={p.key} href={href(p.key, cat)} className={"tab" + (p.key === period ? " on" : "")}>{p.label}</Link>)}
      </div>
      <div className="tabs" aria-label="Category">
        <Link href={href(period, null)} className={"tab" + (!cat ? " on" : "")}>All</Link>
        {CATEGORIES.map((c) => <Link key={c.slug} href={href(period, c.slug)} className={"tab" + (cat === c.slug ? " on" : "")}>{c.label}</Link>)}
      </div>
      <div className="grid">
        <section>
          {rows.length === 0 && <div className="card">No listings {cat ? `in ${categoryLabel(cat)} ` : ""}yet. Be the first to claim #1.</div>}
          {rows.map((r, i) => <BoardItem key={r.id} row={r} rank={i + 1} />)}
        </section>
        <aside>
          <div className="box">
            <h4>Today's ranking</h4>
            {today.length === 0 && <div className="meta">No bids yet today.</div>}
            {today.map((r, i) => (
              <div className="mini" key={r.id}>
                <span>#{i + 1}</span><Link href={`/l/${r.slug}`}>{r.title.slice(0, 24)}</Link><span className="amt">{fmtUsd(r.total_cents)}</span>
              </div>
            ))}
          </div>
          <div className="box"><h4>Weekly top-10 email</h4><Newsletter source="home" /></div>
        </aside>
      </div>
    </main>
  );
}
