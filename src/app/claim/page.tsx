import ClaimForm from "../../components/ClaimForm";
import { isCategory } from "../../lib/config";
import { isCountryCode } from "../../lib/countries";
import { SCOPES, type Scope } from "../../lib/pricing";

export const metadata = { title: "Claim your rank" };

export default async function Claim({ searchParams }: { searchParams: Promise<{ country?: string; category?: string; scope?: string; url?: string }> }) {
  const sp = await searchParams;
  const country = (sp.country ?? "").toUpperCase();
  return (
    <main>
      <ClaimForm
        defaults={{
          country: isCountryCode(country) ? country : undefined,
          category: sp.category && isCategory(sp.category) ? sp.category : undefined,
          scope: SCOPES.includes(sp.scope as Scope) ? (sp.scope as Scope) : undefined,
          url: sp.url?.slice(0, 300),
        }}
      />
    </main>
  );
}
