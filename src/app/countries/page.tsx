import Finder from "../../components/Finder";
import { COUNTRIES } from "../../lib/countries";
import { countryListingCounts } from "../../lib/rank";

export const dynamic = "force-dynamic";
export const metadata = { title: "All countries", description: "Business rankings for every country." };

export default function Countries() {
  const counts = countryListingCounts();
  const items = COUNTRIES.map((c) => ({ href: `/c/${c.slug}`, label: `${c.flag} ${c.name}`, badge: counts[c.code] ? String(counts[c.code]) : undefined }));
  return (
    <main>
      <h1>Rankings by country</h1>
      <p className="meta">Pick a country to see its top 100 and every category inside it. Numbers show how many businesses are ranked.</p>
      <Finder items={items} placeholder="Search countries…" />
    </main>
  );
}
