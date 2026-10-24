import type { Metadata } from "next";
import "./globals.css";
import { BRAND, SITE_URL, TAGLINE } from "../lib/config";

const siteSchema = JSON.stringify([
  { "@context": "https://schema.org", "@type": "Organization", name: BRAND, url: SITE_URL, logo: `${SITE_URL}/icon-512.png` },
  { "@context": "https://schema.org", "@type": "WebSite", name: BRAND, url: SITE_URL },
]).replace(/</g, "\\u003c");
import { Footer, Header, Ticker } from "../components/Shell";
import Beacon from "../components/Beacon";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND}: the AI tools & SaaS leaderboard`, template: `%s | ${BRAND}` },
  description: TAGLINE,
  openGraph: { siteName: BRAND, type: "website" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteSchema }} /></head>
      <body>
        <Beacon />
        <Ticker />
        <div className="wrap"><Header />{children}</div>
        <Footer />
      </body>
    </html>
  );
}
