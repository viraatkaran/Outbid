import { db } from "./db";

export type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type GscResult =
  | { ok: true; site: string; from: string; to: string; totals: { clicks: number; impressions: number; ctr: number; position: number }; queries: GscRow[]; pages: GscRow[]; days: GscRow[] }
  | { ok: false; reason: "not_connected" | "error"; message: string };

const kvGet = (key: string) => (db().prepare("SELECT value FROM kv WHERE key=?").get(key) as { value: string } | undefined)?.value;

async function accessToken(refresh: string): Promise<string> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refresh, grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error("Google refused the saved Search Console permission. Click the Connect Search Console button again.");
  return ((await r.json()) as { access_token: string }).access_token;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Last 28 days of Search Console data (it lags about 2 days behind). */
export async function getSearchConsole(): Promise<GscResult> {
  const refresh = kvGet("gsc_refresh_token");
  if (!refresh) return { ok: false, reason: "not_connected", message: "Search Console is not connected yet. Click the Connect Search Console button and allow read-only access." };
  const site = process.env.GSC_SITE || "sc-domain:billboardrank.com";
  try {
    const token = await accessToken(refresh);
    const to = new Date(Date.now() - 2 * 86400_000);
    const from = new Date(to.getTime() - 27 * 86400_000);
    const query = async (dimensions: string[], rowLimit: number) => {
      const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ startDate: iso(from), endDate: iso(to), dimensions, rowLimit }),
      });
      if (!r.ok) {
        const t = await r.text();
        if (r.status === 403 || r.status === 404) throw new Error(`Google says this login has no access to "${site}" in Search Console. Add and verify billboardrank.com in Search Console first. (${t.slice(0, 120)})`);
        throw new Error(`Search Console error ${r.status}: ${t.slice(0, 160)}`);
      }
      return (((await r.json()) as { rows?: GscRow[] }).rows ?? []);
    };
    const [total, queries, pages, days] = await Promise.all([query([], 1), query(["query"], 25), query(["page"], 15), query(["date"], 40)]);
    const t = total[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    return { ok: true, site, from: iso(from), to: iso(to), totals: { clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position }, queries, pages, days };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : "Search Console request failed." };
  }
}
