import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoardItem from "../../../../components/BoardItem";
import PeriodTabs from "../../../../components/PeriodTabs";
import SearchForm from "../../../../components/SearchForm";
import { BRAND, categoryLabel, fmtUsd, isCategory } from "../../../../lib/config";
import { getCountryBySlug } from "../../../../lib/countries";
import { floorCents } from "../../../../lib/pricing";
import { getBoard, isPeriod } from "../../../../lib/rank";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ country: string; category: string }> }): Promise<Metadata> {
  const p = await params;
  const c = getCountryBySlug(p.country);
  if (!c || !isCategory(p.category)) return {};
  return { title: `Best ${categoryLabel(p.category)} in ${c.name}`, description: `Top ${categoryLabel(p.category)} businesses in ${c.name} ranked on ${BRAND}.` };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ country: string; category: string }>; searchParams: Promise<{ period?: string; q?: string }> }) {
  const p = await params;
  const c = getCountryBySlug(p.country);
  if (!c || !isCategory(p.category)) notFound();
  const sp = await searchParams;
  const period = isPeriod(sp.period) ? sp.period : "all";
  const label = categoryLabel(p.category);
  const rows = getBoard({ scope: "category", country: c.code, category: p.category, period, q: sp.q, limit: 100 });

  return (
    <main>
      <p className="crumbs"><Link href="/">Worldwide</Link> › <Link href={`/c/${c.slug}`}>{c.name}</Link> › {label}</p>
      <h1>{label} in {c.name} {c.flag}</h1>
      <p className="meta">Start at {fmtUsd(floorCents("category", c.code))}. Payments at the country or worldwide level also count here.</p>
      <p><Link className="btn" href={`/claim?country=${c.code}&category=${p.category}&scope=category`}>Claim #1 in {label}</Link></p>
      <SearchForm q={sp.q} placeholder={`Search ${label.toLowerCase()} in ${c.name}…`} hidden={{ period }} />
      <PeriodTabs base={`/c/${c.slug}/${p.category}`} period={period} extra={sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""} />
      {rows.length === 0 && <div className="card">{sp.q ? `No match for "${sp.q}".` : `Nobody has claimed ${label} in ${c.name} yet. Claim the top spot.`}</div>}
      {rows.map((r, i) => <BoardItem key={r.id} row={r} rank={i + 1} />)}
    </main>
  );
}
