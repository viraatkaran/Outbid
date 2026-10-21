import Link from "next/link";
import { BRAND } from "../lib/config";
import { siteStats } from "../lib/rank";
import ThemeToggle from "./ThemeToggle";
import Newsletter from "./Newsletter";

export function Header() {
  const s = siteStats();
  const lastCap = BRAND.search(/[A-Z][^A-Z]*$/);
  const splitAt = lastCap > 0 ? lastCap : Math.ceil(BRAND.length / 2);
  return (
    <header className="top">
      <Link href="/" className="logo">{BRAND.slice(0, splitAt)}<b>{BRAND.slice(splitAt)}</b></Link>
      <span className="pill"><span className="dot" />{s.clicksToday.toLocaleString()} verified clicks today</span>
      <nav className="main">
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
          <strong>Weekly top-10 of AI tools &amp; SaaS</strong>
          <p style={{ margin: "6px 0 10px" }}>Who is winning this week, and what's launching.</p>
          <Newsletter source="footer" />
        </div>
        <div>
          <Link href="/blog">Blog</Link><br /><Link href="/rules">Rules &amp; refunds</Link><br />
          <Link href="/about">About</Link><br /><Link href="/rss.xml">RSS</Link><br />
          <Link href="/api/v1/leaderboard">API</Link>
        </div>
        <div>© {new Date().getFullYear()} {BRAND}. Rankings reflect paid placement.</div>
      </div>
    </footer>
  );
}
