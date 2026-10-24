import { redirect } from "next/navigation";
import { currentAdmin } from "../../lib/adminAuth";
import { db } from "../../lib/db";
import type { Listing } from "../../lib/listings";
import { CATEGORY_GROUPS, fmtUsd } from "../../lib/config";
import { getAllPosts } from "../../lib/blog";
import { getSearchConsole } from "../../lib/gsc";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

type Row = Record<string, string | number | null>;
const q = (sql: string, ...args: (string | number)[]) => db().prepare(sql).all(...args) as Row[];
const one = (sql: string, ...args: (string | number)[]) => (db().prepare(sql).get(...args) as Row | undefined) ?? {};
const day = (offset = 0) => new Date(Date.now() + offset * 86400_000).toISOString().slice(0, 10);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Table({ head, rows }: { head: string[]; rows: (string | number | null)[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table><thead><tr>{head.map((h) => <th key={h} style={{ textAlign: "left" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c ?? "-"}</td>)}</tr>) : <tr><td colSpan={head.length}>Nothing yet.</td></tr>}</tbody></table>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <div style={{ border: "1px solid var(--border, #ddd)", borderRadius: 12, padding: "12px 16px", minWidth: 150, flex: "1 1 150px" }}>
    <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div><div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>{sub && <div style={{ fontSize: 12, opacity: 0.7 }}>{sub}</div>}
  </div>;
}

export default async function Admin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  const d = db();

  // Earnings (gross card payments before Stripe fees; every paid order is real money in live mode)
  const money = (from: string) => Number(one("SELECT COALESCE(SUM(amount_cents),0) c FROM orders WHERE status='paid' AND substr(created_at,1,10) >= ?", from).c);
  const earnTotal = Number(one("SELECT COALESCE(SUM(amount_cents),0) c, COUNT(*) n FROM orders WHERE status='paid'").c);
  const paidCount = Number(one("SELECT COUNT(*) n FROM orders WHERE status='paid'").n);
  const byScope = q("SELECT scope, COUNT(*) n, SUM(amount_cents) c FROM orders WHERE status='paid' GROUP BY scope");
  const payments = q("SELECT o.id, o.created_at, o.scope, o.country, o.category, o.amount_cents, o.email, l.slug FROM orders o LEFT JOIN listings l ON l.id=o.listing_id WHERE o.status='paid' ORDER BY o.created_at DESC LIMIT 25");
  const pending = Number(one("SELECT COUNT(*) n FROM orders WHERE status!='paid'").n);

  // Visitors (own analytics; unique visitors = distinct people per day, counted per day)
  const views = (from: string) => Number(one("SELECT COUNT(*) n FROM pageviews WHERE day >= ?", from).n);
  const uniques = (from: string) => Number(one("SELECT COUNT(*) n FROM (SELECT DISTINCT day, visitor_hash FROM pageviews WHERE day >= ?)", from).n);
  const perDay = q("SELECT day, COUNT(*) views, COUNT(DISTINCT visitor_hash) visitors FROM pageviews WHERE day >= ? GROUP BY day ORDER BY day DESC", day(-13));
  const topPages = q("SELECT path, COUNT(*) views, COUNT(DISTINCT visitor_hash) visitors FROM pageviews WHERE day >= ? GROUP BY path ORDER BY views DESC LIMIT 15", day(-29));
  const topRefs = q("SELECT COALESCE(referrer,'(direct / none)') ref, COUNT(*) views FROM pageviews WHERE day >= ? GROUP BY ref ORDER BY views DESC LIMIT 12", day(-29));
  const regions = q("SELECT COALESCE(lang_region,'unknown') region, COUNT(*) views FROM pageviews WHERE day >= ? GROUP BY region ORDER BY views DESC LIMIT 12", day(-29));
  const devices = q("SELECT device, COUNT(*) views FROM pageviews WHERE day >= ? GROUP BY device", day(-29));
  const outClicks = one("SELECT COUNT(*) raw, COALESCE(SUM(verified),0) v FROM clicks WHERE day >= ?", day(-29));
  const subs = Number(one("SELECT COUNT(*) n FROM subscribers").n);
  const listingCount = Number(one("SELECT COUNT(*) n FROM listings WHERE status='active'").n);

  // Blog
  const today = day();
  const posts = getAllPosts().sort((a, b) => b.date.localeCompare(a.date));
  const scheduled = posts.filter((p) => p.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const published = posts.filter((p) => p.date <= today);
  const coveredDays = [1, 2, 3].filter((n) => scheduled.some((p) => p.date === day(n)));
  const bufferOk = coveredDays.length === 3;

  const gsc = await getSearchConsole();

  const listings = d.prepare("SELECT * FROM listings ORDER BY id DESC LIMIT 100").all() as Listing[];
  const reports = q("SELECT r.id, l.slug, r.reason, r.created_at FROM reports r JOIN listings l ON l.id=r.listing_id ORDER BY r.id DESC LIMIT 50");
  const outbox = q("SELECT * FROM outbox ORDER BY id DESC LIMIT 20");
  const messages = q("SELECT * FROM messages ORDER BY id DESC LIMIT 20");
  const connectedBy = (d.prepare("SELECT value FROM kv WHERE key='gsc_connected_by'").get() as { value: string } | undefined)?.value;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1>Admin dashboard</h1>
        <form method="post" action="/api/auth/logout"><span style={{ marginRight: 8, fontSize: 13 }}>{admin}</span><button>Sign out</button></form>
      </div>
      <p style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <a href="#earnings">Earnings</a><a href="#visitors">Visitors</a><a href="#search">Google Search Console</a><a href="#blog">Blog</a><a href="#listings">Listings</a><a href="#inbox">Emails and messages</a>
      </p>

      <h2 id="earnings">Earnings</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Today" value={fmtUsd(money(day()))} />
        <Stat label="Last 7 days" value={fmtUsd(money(day(-6)))} />
        <Stat label="Last 30 days" value={fmtUsd(money(day(-29)))} />
        <Stat label="All time" value={fmtUsd(earnTotal)} sub={`${paidCount} payments`} />
        <Stat label="Unpaid checkouts" value={pending} sub="started, not paid" />
      </div>
      <p style={{ fontSize: 13, opacity: 0.7 }}>Amounts are what customers paid, before Stripe fees. Stripe shows your payout after fees.</p>
      <Table head={["Level", "Payments", "Total"]} rows={byScope.map((r) => [String(r.scope), Number(r.n), fmtUsd(Number(r.c))])} />
      <h3>Latest payments</h3>
      <Table head={["When (UTC)", "Level", "Country", "Category", "Amount", "Listing", "Email"]}
        rows={payments.map((p) => [String(p.created_at).slice(0, 16).replace("T", " "), String(p.scope), String(p.country), String(p.category), fmtUsd(Number(p.amount_cents)), p.slug as string, p.email as string])} />

      <h2 id="visitors">Website visitors</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Visitors today" value={uniques(today)} sub={`${views(today)} page views`} />
        <Stat label="Visitors, 7 days" value={uniques(day(-6))} sub={`${views(day(-6))} page views`} />
        <Stat label="Visitors, 30 days" value={uniques(day(-29))} sub={`${views(day(-29))} page views`} />
        <Stat label="Outbound clicks, 30 days" value={Number(outClicks.raw)} sub={`${Number(outClicks.v)} verified`} />
        <Stat label="Active listings" value={listingCount} sub={`${subs} newsletter subscribers`} />
      </div>
      <p style={{ fontSize: 13, opacity: 0.7 }}>Our own privacy-friendly counter: bots are filtered out, no IP addresses are stored, and a visitor is counted once per day. Countries are estimated from the browser language, not exact location.</p>
      <h3>Last 14 days</h3>
      <Table head={["Day", "Visitors", "Page views"]} rows={perDay.map((r) => [String(r.day), Number(r.visitors), Number(r.views)])} />
      <h3>Top pages (30 days)</h3>
      <Table head={["Page", "Views", "Visitors"]} rows={topPages.map((r) => [String(r.path), Number(r.views), Number(r.visitors)])} />
      <h3>Where visitors come from (30 days)</h3>
      <Table head={["Source", "Views"]} rows={topRefs.map((r) => [String(r.ref), Number(r.views)])} />
      <h3>Regions and devices (30 days)</h3>
      <Table head={["Browser language region", "Views"]} rows={regions.map((r) => [String(r.region), Number(r.views)])} />
      <Table head={["Device", "Views"]} rows={devices.map((r) => [String(r.device), Number(r.views)])} />

      <h2 id="search">Google Search Console</h2>
      {gsc.ok ? (
        <>
          <p style={{ fontSize: 13, opacity: 0.7 }}>{gsc.site}, {gsc.from} to {gsc.to} (Google reports with about a 2 day delay){connectedBy ? `, connected by ${connectedBy}` : ""}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Stat label="Clicks from Google" value={gsc.totals.clicks} />
            <Stat label="Impressions" value={gsc.totals.impressions} />
            <Stat label="Click rate" value={pct(gsc.totals.ctr)} />
            <Stat label="Average position" value={gsc.totals.position.toFixed(1)} />
          </div>
          <h3>Top search queries</h3>
          <Table head={["Query", "Clicks", "Impressions", "Click rate", "Position"]} rows={gsc.queries.map((r) => [r.keys[0], r.clicks, r.impressions, pct(r.ctr), r.position.toFixed(1)])} />
          <h3>Top pages</h3>
          <Table head={["Page", "Clicks", "Impressions", "Click rate", "Position"]} rows={gsc.pages.map((r) => [r.keys[0].replace(/^https?:\/\/[^/]+/, "") || "/", r.clicks, r.impressions, pct(r.ctr), r.position.toFixed(1)])} />
          <h3>By day</h3>
          <Table head={["Day", "Clicks", "Impressions"]} rows={[...gsc.days].sort((a, b) => b.keys[0].localeCompare(a.keys[0])).slice(0, 28).map((r) => [r.keys[0], r.clicks, r.impressions])} />
        </>
      ) : (
        <div role="status" style={{ border: "1px solid #e0a800", borderRadius: 10, padding: 12 }}>{gsc.message}
          {gsc.reason === "not_connected" && <> <form method="post" action="/api/auth/logout" style={{ display: "inline" }}><button>Sign out</button></form></>}</div>
      )}

      <h2 id="blog">Blog</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Published" value={published.length} />
        <Stat label="Scheduled" value={scheduled.length} />
        <Stat label="3-day buffer" value={bufferOk ? "OK" : `${coveredDays.length}/3`} sub={bufferOk ? "next 3 days are covered" : "some of the next 3 days have no post yet"} />
      </div>
      <h3>Scheduled (will publish by itself on its date, UTC)</h3>
      <Table head={["Publishes", "Title", "Words", "Main keyword"]} rows={scheduled.map((p) => [p.date, p.title, p.words, p.keywords[0] ?? ""])} />
      <h3>Published</h3>
      <Table head={["Date", "Title", "Words", "Link"]} rows={published.map((p) => [p.date, p.title, p.words, `/blog/${p.slug}`])} />

      <h2 id="listings">Listings</h2>
      <div style={{ overflowX: "auto" }}><table><tbody>{listings.map((l) => (
        <tr key={l.id}><td>{l.slug}</td><td>{l.status}</td><td>
          <form method="post" action="/api/admin/category" style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            <input type="hidden" name="id" value={l.id} />
            <select name="category" defaultValue={l.category}>{CATEGORY_GROUPS.flatMap((g) => g.items).map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
            <button>Change category</button>
          </form>
          <form method="post" action="/api/admin/hide">
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="status" value={l.status === "active" ? "hidden" : "active"} />
            <button>{l.status === "active" ? "Hide" : "Restore"}</button>
          </form></td></tr>
      ))}</tbody></table></div>

      <h2 id="inbox">Recent emails ({process.env.RESEND_API_KEY ? "live" : "dry-run: nothing is actually sent"})</h2>
      <Table head={["When", "To", "Subject", "Status"]} rows={outbox.map((m) => [String(m.created_at).slice(0, 16).replace("T", " "), String(m.to_email), String(m.subject), `${m.status}${m.error ? ` (${m.error})` : ""}`])} />
      <h3>Contact messages</h3>
      <Table head={["When", "From", "Message"]} rows={messages.map((m) => [String(m.created_at).slice(0, 16).replace("T", " "), `${m.name} (${m.email})`, String(m.message)])} />
      <h3>Reports</h3>
      <Table head={["Listing", "Reason", "Date"]} rows={reports.map((r) => [String(r.slug), String(r.reason), String(r.created_at).slice(0, 10)])} />
    </main>
  );
}
