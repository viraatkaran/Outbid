export const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "ToolTower";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const TAGLINE = "The leaderboard for AI tools & SaaS. Pay to climb, with verified clicks to prove it.";

export const MIN_FIRST_BID_CENTS = 500;
export const MIN_BID_CENTS = 100;
export const MAX_BID_CENTS = 1_000_000;

export const CATEGORIES = [
  { slug: "ai-agents", label: "AI Agents" },
  { slug: "ai-writing", label: "AI Writing" },
  { slug: "ai-image-video", label: "AI Image & Video" },
  { slug: "dev-tools", label: "Dev Tools" },
  { slug: "marketing-seo", label: "Marketing & SEO" },
  { slug: "productivity", label: "Productivity" },
  { slug: "sales-crm", label: "Sales & CRM" },
  { slug: "support", label: "Customer Support" },
  { slug: "data-analytics", label: "Data & Analytics" },
  { slug: "design", label: "Design" },
  { slug: "no-code", label: "No-code" },
  { slug: "other", label: "Other SaaS" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export const categoryLabel = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
export const isCategory = (s: string): s is CategorySlug => CATEGORIES.some((c) => c.slug === s);

export const fmtUsd = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
