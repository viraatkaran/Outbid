import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";

export type Post = {
  slug: string; title: string; date: string; updated: string | null; description: string;
  tags: string[]; keywords: string[]; author: string; body: string; html: string; words: number; minutes: number;
};

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");

// Posts may be written by an automated agent, so raw HTML is dropped and only safe link targets are kept.
const md = new Marked({
  renderer: { html: () => "" },
  walkTokens(token) {
    if ((token.type === "link" || token.type === "image") && !/^(https?:\/\/|mailto:|\/|#)/i.test(token.href)) token.href = "#";
  },
});

const list = (v: string | undefined) => (v ?? "").split(",").map((t) => t.trim()).filter(Boolean);

export function parsePost(slug: string, raw: string): Post {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const fm: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  const body = (m?.[2] ?? raw).trim();
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: fm.title || slug,
    date: fm.date || "1970-01-01",
    updated: fm.updated || null,
    description: fm.description || "",
    tags: list(fm.tags),
    keywords: list(fm.keywords),
    author: fm.author || "The BillboardRank team",
    body,
    html: md.parse(body, { async: false }) as string,
    words,
    minutes: Math.max(1, Math.round(words / 220)),
  };
}

const today = () => new Date().toISOString().slice(0, 10);

/** Every post file, including ones dated in the future (scheduled). */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parsePost(f.replace(/\.md$/, ""), fs.readFileSync(path.join(BLOG_DIR, f), "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Posts whose date has arrived (UTC). A post dated tomorrow stays hidden until tomorrow, so a week of posts can be queued. */
export const getPosts = (): Post[] => getAllPosts().filter((p) => p.date <= today());
export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export function relatedPosts(post: Post, n = 3): Post[] {
  return getPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, n)
    .map((x) => x.p);
}
