// ISO 3166-1 alpha-2 codes offered on the site. Sanctioned jurisdictions are left out of the list.
const CODES =
  "AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BR BN BG BF BI CV KH CM CA KY CF TD CL CN CO KM CG CD CK CR CI HR CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT VA HN HK HU IS IN ID IQ IE IM IL IT JM JP JE JO KZ KE KI KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG MK MP NO OM PK PW PS PA PG PY PE PH PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA SS ES LK SD SR SE CH TW TJ TZ TH TL TG TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VE VN VG VI WF YE ZM ZW".split(" ");

const TIER1 = new Set("US CA GB IE AU NZ DE FR NL BE LU AT CH SE NO DK FI IS IT ES PT JP KR SG HK TW IL AE QA KW SA BH CY MT EE SI CZ".split(" "));
const TIER3 = new Set(
  "AF BD BF BI CD CF TD ET GM GN GW HT KE LR MG MW ML MZ NE NG NP RW SL SO SS SD TZ TG UG YE ZM ZW LA KH MM PK LK IN".split(" "),
);

export type Country = { code: string; name: string; slug: string; flag: string; tier: 1 | 2 | 3 };

const names = new Intl.DisplayNames(["en"], { type: "region" });
const flagOf = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
const slugOf = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const COUNTRIES: Country[] = CODES.map((code) => {
  const name = names.of(code) || code;
  return { code, name, slug: slugOf(name), flag: flagOf(code), tier: TIER1.has(code) ? 1 : TIER3.has(code) ? 3 : 2 } as Country;
})
  .filter((c) => c.name !== c.code)
  .sort((a, b) => a.name.localeCompare(b.name));

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));
const bySlug = new Map(COUNTRIES.map((c) => [c.slug, c]));

export const isCountryCode = (code: string) => byCode.has(code);
export const getCountry = (code: string) => byCode.get(code);
export const getCountryBySlug = (slug: string) => bySlug.get(slug);
export const countryName = (code: string) => byCode.get(code)?.name ?? code;
export const countryFlag = (code: string) => byCode.get(code)?.flag ?? "🌐";
export const countryTier = (code?: string | null): 1 | 2 | 3 => (code && byCode.get(code)?.tier) || 2;
