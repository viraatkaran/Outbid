import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND, SITE_URL, categoryLabel, fmtUsd } from "../../../lib/config";
import { countryFlag, countryName, getCountry } from "../../../lib/countries";
import { getListingBySlug } from "../../../lib/listings";
import { SCOPE_LABEL } from "../../../lib/pricing";
import { PERIODS, getBoard, getRank, listingRanks } from "../../../lib/rank";
import ReportButton from "./ReportButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const l = getListingBySlug((await params).slug);
  if (!l || l.status !== "active") return {};
  const title = `${l.title} on ${BRAND}`;
  return { title, description: l.description, openGraph: { title, description: l.description, images: [`${SITE_URL}/api/og/${l.slug}`] }, twitter: { card: "summary_large_image" } };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const l = getListingBySlug((await params).slug);
  if (!l || l.status !== "active") notFound();
  const ranks = listingRanks(l);
  const country = getCountry(l.country);
  const row = getBoard({ scope: "category", country: l.country, category: l.category, period: "all", limit: 100 }).find((r) => r.id === l.id);
  return (
    <main className="prose">
      <h1>{l.title}</h1>
      <p>{l.description}</p>
      <p className="meta">
        {country && <Link className="tag" href={`/c/${country.slug}`}>{countryFlag(l.country)} {countryName(l.country)}</Link>}
        {country && <Link className="tag" href={`/c/${country.slug}/${l.category}`}>{categoryLabel(l.category)}</Link>}
        <a href={`/go/${l.slug}`} target="_blank" rel="sponsored nofollow noopener">Visit {l.domain} →</a>
        <span className="sponsored">paid placement</span>
      </p>
      <div className="card">
        <table>
          <tbody>
            {(["world", "country", "category"] as const).map((s) => (
              <tr key={s}><th>{s === "world" ? SCOPE_LABEL.world : s === "country" ? `${countryName(l.country)}` : `${categoryLabel(l.category)} in ${countryName(l.country)}`}</th>
                <td>{ranks[s] ? `#${ranks[s]!.rank} of ${ranks[s]!.ofCount}` : "not ranked"}</td></tr>
            ))}
            {PERIODS.filter((p) => p.key !== "all").map((p) => {
              const r = getRank(l.id, { scope: "category", country: l.country, category: l.category }, p.key);
              return <tr key={p.key}><th>{p.label} (category)</th><td>{r ? `#${r.rank} of ${r.ofCount}` : "not ranked"}</td></tr>;
            })}
            <tr><th>Paid on category board</th><td>{fmtUsd(row?.total_cents ?? 0)}</td></tr>
            <tr><th>Verified clicks</th><td>{(row?.clicks ?? 0).toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
      <Link className="btn" href={`/claim?url=${encodeURIComponent(l.url)}`}>Outbid this listing</Link>{" "}
      <a className="btn ghost" href={`/api/og/${l.slug}`} target="_blank">Share card</a>
      <p><ReportButton slug={l.slug} /></p>
    </main>
  );
}
