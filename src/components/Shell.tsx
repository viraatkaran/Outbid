import Link from "next/link";
import { BRAND, fmtUsd } from "../lib/config";
import { getBoard, siteStats } from "../lib/rank";
import ThemeToggle from "./ThemeToggle";
import Newsletter from "./Newsletter";

export function Header() {
  const s = siteStats();
  const lastCap = BRAND.search(/[A-Z][^A-Z]*$/);
  const splitAt = lastCap > 0 ? lastCap : Math.ceil(BRAND.length / 2);
  return (
    <header className="top">
      <Link href="/" className="logo"><span>{BRAND.slice(0, splitAt)}<b>{BRAND.slice(splitAt)}</b></span></Link>
      <span className="pill"><span className="dot" />{s.clicksToday.toLocaleString()} verified clicks today</span>
      <nav className="main">
        <Link href="/countries">Countries</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/rules">Rules</Link>
        <Link href="/about">About</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap cols">
        <div style={{ maxWidth: 360 }}>
          <strong>Weekly worldwide top 10</strong>
          <p style={{ margin: "6px 0 10px" }}>Who is winning this week, and what's launching.</p>
          <Newsletter source="footer" />
        </div>
        <div>
          <Link href="/countries">Countries</Link><br /><Link href="/blog">Blog</Link><br /><Link href="/rules">Rules &amp; refunds</Link><br /><Link href="/recover">Find my dashboard</Link><br />
          <Link href="/contact">Contact</Link><br /><Link href="/privacy">Privacy</Link><br /><Link href="/terms">Terms</Link><br />
          <Link href="/about">About</Link><br /><Link href="/rss.xml">RSS</Link><br />
          <Link href="/api/v1/leaderboard">API</Link>
        </div>
        <div>© {new Date().getFullYear()} {BRAND}. Rankings reflect paid placement.</div>
      </div>
    </footer>
  );
}

export function Ticker() {
  const rows = getBoard({ scope: "world", period: "all", limit: 10 });
  const render = (prefix: string) =>
    rows.length ? (
      rows.map((r, i) => (
        <span key={prefix + r.id}>
          <span className="t">#{i + 1}</span> <b>{r.title.slice(0, 28)}</b> <span className="t">{fmtUsd(r.total_cents)}</span>
        </span>
      ))
    ) : (
      <span key={prefix}><b>LIVE</b> <span className="t">The worldwide board is empty. Claim the first slot.</span></span>
    );
  return (
    <div className="ticker" aria-label="Live leaderboard ticker">
      <div className="track">
        {render("a")}
        <span aria-hidden="true" style={{ display: "contents" }}>{render("b")}</span>
      </div>
    </div>
  );
}
