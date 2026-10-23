import { notFound } from "next/navigation";
import { db } from "../../lib/db";
import type { Listing } from "../../lib/listings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const key = (await searchParams).key;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) notFound();
  const d = db();
  const listings = d.prepare("SELECT * FROM listings ORDER BY id DESC LIMIT 100").all() as Listing[];
  const reports = d.prepare("SELECT r.*, l.slug FROM reports r JOIN listings l ON l.id=r.listing_id ORDER BY r.id DESC LIMIT 50").all() as { id: number; slug: string; listing_id: number; reason: string; created_at: string }[];
  const outbox = d.prepare("SELECT * FROM outbox ORDER BY id DESC LIMIT 20").all() as { id: number; to_email: string; subject: string; status: string; error: string | null; created_at: string }[];
  const subs = (d.prepare("SELECT COUNT(*) n FROM subscribers").get() as { n: number }).n;
  return (
    <main style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>Admin</h1>
      <p>{subs} newsletter subscribers</p>
      <h2>Recent emails ({process.env.RESEND_API_KEY ? "live" : "dry-run: nothing is actually sent"})</h2>
      <table><tbody>{outbox.map((m) => <tr key={m.id}><td>{m.created_at.slice(0, 16).replace("T", " ")}</td><td>{m.to_email}</td><td>{m.subject}</td><td>{m.status}{m.error ? ` (${m.error})` : ""}</td></tr>)}</tbody></table>
      <h2>Reports</h2>
      <table><tbody>{reports.map((r) => <tr key={r.id}><td>{r.slug}</td><td>{r.reason}</td><td>{r.created_at.slice(0, 10)}</td></tr>)}</tbody></table>
      <h2>Listings</h2>
      <table><tbody>{listings.map((l) => (
        <tr key={l.id}><td>{l.slug}</td><td>{l.status}</td><td>
          <form method="post" action="/api/admin/hide">
            <input type="hidden" name="key" value={key} /><input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="status" value={l.status === "active" ? "hidden" : "active"} />
            <button>{l.status === "active" ? "Hide" : "Restore"}</button>
          </form></td></tr>
      ))}</tbody></table>
    </main>
  );
}
