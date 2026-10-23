import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoardItem from "../../../components/BoardItem";
import Finder from "../../../components/Finder";
import PeriodTabs from "../../../components/PeriodTabs";
import SearchForm from "../../../components/SearchForm";
import { BRAND, CATEGORY_GROUPS, fmtUsd } from "../../../lib/config";
import { getCountryBySlug } from "../../../lib/countries";
import { floorCents } from "../../../lib/pricing";
import { categoryCounts, getBoard, isPeriod } from "../../../lib/rank";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const c = getCountryBySlug((await params).country);
  return c ? { title: `Top businesses in ${c.name}`, description: `The top 100 businesses in ${c.name} on ${BRAND}, with a ranking for every category.` } : {};
}

export default async function CountryPage({ params, searchParams }: { params: Promise<{ country: string }>; searchParams: Promise<{ period?: string; q?: string }> }) {
  const c = getCountryBySlug((await params).country);
  if (!c) notFound();
  const sp = await searchParams;
  const period = isPeriod(sp.period) ? sp.period : "all";
  const rows = getBoard({ scope: "country", country: c.code, period, q: sp.q, limit: 100 });
  const counts = categoryCounts(c.code);
  const items = CATEGORY_GROUPS.flatMap((g) => g.items.map((i) => ({ href: `/c/${c.slug}/${i.slug}`, label: i.label, group: g.name, badge: counts[i.slug] ? String(counts[i.slug]) : undefined })));

  return (
    <main>
      <p className="crumbs"><Link href="/">Worldwide</Link> › <Link href="/countries">Countries</Link> › {c.name}</p>
      <h1>{c.flag} Top 100 in {c.name}</h1>
      <p className="meta">Country level ranking across all categories. Pay at the country level from {fmtUsd(floorCents("country", c.code))}, or at a category level from {fmtUsd(floorCents("category", c.code))}.</p>
      <p><Link className="btn" href={`/claim?country=${c.code}&scope=country`}>Claim #1 in {c.name}</Link></p>

      <h2 className="section">Top 100 in {c.name}</h2>
      <SearchForm q={sp.q} placeholder={`Search businesses in ${c.name}…`} hidden={{ period }} />
      <PeriodTabs base={`/c/${c.slug}`} period={period} extra={sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""} />
      {rows.length === 0 && <div className="card">{sp.q ? `No match for "${sp.q}".` : `No country-level listings in ${c.name} yet. Be the first.`}</div>}
      {rows.map((r, i) => <BoardItem key={r.id} row={r} rank={i + 1} />)}

      <h2 className="section">Categories in {c.name}</h2>
      <Finder items={items} placeholder={`Search categories in ${c.name}…`} grouped />
    </main>
  );
}
