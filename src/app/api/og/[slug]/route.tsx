import { ImageResponse } from "next/og";
import { BRAND, categoryLabel, fmtUsd } from "../../../../lib/config";
import { getListingBySlug } from "../../../../lib/listings";
import { getBoard, getRank } from "../../../../lib/rank";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getListingBySlug(slug);
  const row = l ? getBoard({ period: "all", limit: 1000 }).find((r) => r.id === l.id) : undefined;
  const rank = l ? getRank(l.id, "all")?.rank : undefined;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg,#080b18,#1a1040)", color: "#f4f6ff" }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#ffb800" }}>{BRAND}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, fontWeight: 800 }}>{rank ? `Ranked #${rank}` : "Leaderboard"}</div>
          <div style={{ fontSize: 52 }}>{l?.title.slice(0, 40) ?? BRAND}</div>
          <div style={{ fontSize: 30, color: "#8f98c0", marginTop: 8 }}>
            {l ? `${categoryLabel(l.category)} · ${fmtUsd(row?.total_cents ?? 0)} · ${row?.clicks ?? 0} verified clicks` : ""}
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#8f98c0" }}>Paid placement on the AI tools &amp; SaaS leaderboard</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
