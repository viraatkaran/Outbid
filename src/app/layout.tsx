import type { Metadata } from "next";
import "./globals.css";
import { BRAND, SITE_URL, TAGLINE } from "../lib/config";
import { Footer, Header } from "../components/Shell";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND}: the AI tools & SaaS leaderboard`, template: `%s | ${BRAND}` },
  description: TAGLINE,
  openGraph: { siteName: BRAND, type: "website" },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export const dynamic = "force-dynamic";

const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <div className="wrap"><Header />{children}</div>
        <Footer />
      </body>
    </html>
  );
}
