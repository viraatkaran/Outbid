import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/config";
import { getPosts } from "../lib/blog";
import { db } from "../lib/db";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const listings = db().prepare("SELECT slug FROM listings WHERE status='active'").all() as { slug: string }[];
  return [
    ...["", "/blog", "/rules", "/about"].map((p) => ({ url: SITE_URL + p })),
    ...getPosts().map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date })),
    ...listings.map((l) => ({ url: `${SITE_URL}/l/${l.slug}` })),
  ];
}
