import { countryTier } from "./countries";

export type Scope = "category" | "country" | "world";
export const SCOPES: Scope[] = ["category", "country", "world"];

/** Starting price (USD cents) for the first payment at each level, before the country adjustment. */
export const BASE_FLOOR_CENTS: Record<Scope, number> = { category: 500, country: 2900, world: 9900 };

/** Purchasing-power adjustment for category and country levels. Worldwide is the same price everywhere. */
const TIER_MULTIPLIER = { 1: 1, 2: 0.6, 3: 0.35 } as const;

/** Smallest payment once a listing has already paid at that level. */
export const MIN_RAISE_CENTS = 100;

export function floorCents(scope: Scope, country?: string | null): number {
  const base = BASE_FLOOR_CENTS[scope];
  if (scope === "world") return base;
  return Math.max(200, Math.round((base * TIER_MULTIPLIER[countryTier(country)]) / 100) * 100);
}

export const SCOPE_LABEL: Record<Scope, string> = { category: "Category", country: "Country", world: "Worldwide" };
export const SCOPE_HELP: Record<Scope, string> = {
  category: "Rank inside one category in one country, e.g. Plumbing in New Zealand.",
  country: "Rank across every category in one country (top 100). Also counts on your category board.",
  world: "Rank worldwide (top 100). Also counts on your country and category boards.",
};
