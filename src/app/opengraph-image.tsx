import { ImageResponse } from "next/og";
import { BRAND } from "../lib/config";

export const alt = `${BRAND}: the world ranking for businesses`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#fff9ef,#ffe1c2)", color: "#161a33" }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#d81b60" }}>{BRAND}</div>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>The world ranking for businesses</div>
        <div style={{ fontSize: 36, color: "#6a6f8f", marginTop: 28 }}>Rank by category, country or worldwide, with verified clicks.</div>
      </div>
    ),
    size,
  );
}
