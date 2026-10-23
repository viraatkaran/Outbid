import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/config";
import { getPosts } from "../lib/blog";
import { COUNTRIES } from "../lib/countries";
import { db } from "../lib/db";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const d = db();
  const listings = d.prepare("SELECT slug FROM listings WHERE status='active'").all() as { slug: string }[];
  const combos = d.prepare("SELECT DISTINCT country, category FROM listings WHERE status='active'").all() as { country: string; category: string }[];
  const slugOf = new Map(COUNTRIES.map((c) => [c.code, c.slug]));
  return [
    ...["", "/countries", "/claim", "/blog", "/rules", "/about"].map((p) => ({ url: SITE_URL + p })),
    ...COUNTRIES.map((c) => ({ url: `${SITE_URL}/c/${c.slug}` })),
    ...combos.filter((c) => slugOf.has(c.country)).map((c) => ({ url: `${SITE_URL}/c/${slugOf.get(c.country)}/${c.category}` })),
    ...getPosts().map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date })),
    ...listings.map((l) => ({ url: `${SITE_URL}/l/${l.slug}` })),
  ];
}
