import { BRAND, TAGLINE } from "../../lib/config";

export const metadata = { title: "About" };

export default function About() {
  return (
    <main className="prose">
      <h1>About {BRAND}</h1>
      <p>{TAGLINE}</p>
      <p>AI tool and SaaS makers pay to climb a public leaderboard. Unlike a plain bidding page, every listing shows verified, bot-filtered clicks and owners get a private dashboard with referrers, countries and cost per click, so you can judge whether the spend is worth it.</p>
      <ul>
        <li>Weekly and monthly seasons give smaller teams a chance to win.</li>
        <li>An embeddable widget and a public JSON API let anyone show the live board.</li>
        <li>Everything paid is labelled "paid placement".</li>
      </ul>
    </main>
  );
}
