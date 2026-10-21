import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND, SITE_URL, categoryLabel, fmtUsd } from "../../../lib/config";
import { getListingBySlug } from "../../../lib/listings";
import { PERIODS, getBoard, getRank } from "../../../lib/rank";
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
  const row = getBoard({ period: "all", limit: 1000 }).find((r) => r.id === l.id);
  return (
    <main className="prose">
      <h1>{l.title}</h1>
      <p>{l.description}</p>
      <p className="meta">
        <span className="tag">{categoryLabel(l.category)}</span>
        <a href={`/go/${l.slug}`} target="_blank" rel="sponsored nofollow noopener">Visit {l.domain} →</a>
        <span className="sponsored">paid placement</span>
      </p>
      <div className="card">
        <table>
          <tbody>
            {PERIODS.map((p) => {
              const r = getRank(l.id, p.key);
              return <tr key={p.key}><th>{p.label}</th><td>{r ? `#${r.rank} of ${r.total}` : "not ranked"}</td></tr>;
            })}
            <tr><th>Total paid</th><td>{fmtUsd(row?.total_cents ?? 0)}</td></tr>
            <tr><th>Verified clicks</th><td>{(row?.clicks ?? 0).toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
      <a className="btn" href={`/?cat=${l.category}`}>Outbid this listing</a>{" "}
      <a className="btn ghost" href={`/api/og/${l.slug}`} target="_blank">Share card</a>
      <p><ReportButton slug={l.slug} /></p>
    </main>
  );
}
