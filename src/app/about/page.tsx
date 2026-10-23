import { BRAND, TAGLINE } from "../../lib/config";

export const metadata = { title: "About" };

export default function About() {
  return (
    <main className="prose">
      <h1>About {BRAND}</h1>
      <p>{TAGLINE}</p>
      <p>Businesses of every kind pay to climb a public ranking at three levels: inside a category in their country, across their whole country, or worldwide. Every listing shows verified, bot-filtered clicks, and owners get a private dashboard with referrers, countries and cost per click, plus an email when someone passes them.</p>
      <ul>
        <li>A ranking for every country and for more than a hundred categories, each with its own search.</li>
        <li>Starting prices are lower in lower-income countries, so local businesses can compete.</li>
        <li>An embeddable widget and a public JSON API let anyone show a live board.</li>
        <li>Everything paid is labelled "paid placement".</li>
      </ul>
    </main>
  );
}
