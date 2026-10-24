/**
 * Quality gate for blog posts. Run: npm run check-blog [file ...]
 * With no arguments it checks every post. Exit code 1 if any post fails.
 */
import fs from "node:fs";
import path from "node:path";
import { BLOG_DIR, getAllPosts, parsePost, type Post } from "../src/lib/blog";
import { isCategory } from "../src/lib/config";
import { COUNTRIES } from "../src/lib/countries";

const countrySlugs = new Set(COUNTRIES.map((c) => c.slug));
const STATIC_ROUTES = new Set(["/", "/countries", "/claim", "/rules", "/about", "/blog", "/recover", "/contact", "/privacy", "/terms"]);
const today = new Date().toISOString().slice(0, 10);

function internalLinks(body: string): string[] {
  return [...body.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1].split("#")[0].split("?")[0]);
}

export function checkPost(p: Post, all: Post[]): string[] {
  const errs: string[] = [];
  const add = (m: string) => errs.push(m);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug) || p.slug.length > 80) add("file name must be lowercase-kebab-case (max 80 chars)");
  if (p.title.length < 30 || p.title.length > 70) add(`title is ${p.title.length} chars (need 30-70)`);
  if (p.description.length < 110 || p.description.length > 165) add(`description is ${p.description.length} chars (need 110-165)`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || Number.isNaN(Date.parse(p.date))) add("date must be YYYY-MM-DD");
  else if (p.date > new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10)) add("date is more than 60 days ahead");
  if (p.tags.length < 2 || p.tags.length > 6) add(`needs 2-6 tags (has ${p.tags.length})`);
  if (p.keywords.length < 3 || p.keywords.length > 10) add(`needs 3-10 keywords (has ${p.keywords.length}); the first is the primary keyword`);
  const primary = p.keywords[0]?.toLowerCase();
  if (primary) {
    if (!p.title.toLowerCase().includes(primary)) add("primary keyword (first in keywords) must appear in the title");
    if (!p.description.toLowerCase().includes(primary)) add("primary keyword must appear in the description");
    if (!p.body.split(/\s+/).slice(0, 150).join(" ").toLowerCase().includes(primary)) add("primary keyword must appear in the first 150 words");
    const clash = all.find((o) => o.slug !== p.slug && o.keywords[0]?.toLowerCase() === primary);
    if (clash) add(`primary keyword already used by "${clash.slug}" (avoid competing with our own post)`);
  }
  if (p.words < 700) add(`only ${p.words} words (need at least 700; aim for 1,000-1,500)`);
  if ((p.body.match(/^## /gm) ?? []).length < 3) add("needs at least 3 '## ' sections");
  if (/^# /m.test(p.body)) add("don't put a '# ' heading in the body; the title is the H1");
  if (/<\/?[a-z][^>]*>/i.test(p.body)) add("raw HTML is not allowed, use Markdown");
  if (/lorem ipsum|\bTODO\b|\[insert|\bXXX\b/i.test(p.body)) add("contains placeholder text");
  const links = internalLinks(p.body);
  if (links.length < 2) add("needs at least 2 internal links (to /countries, /c/<country>/<category>, /claim or other posts)");
  for (const l of links) {
    if (STATIC_ROUTES.has(l)) continue;
    const blog = l.match(/^\/blog\/([a-z0-9-]+)$/);
    if (blog) { if (!all.some((o) => o.slug === blog[1])) add(`broken internal link ${l}`); continue; }
    const c = l.match(/^\/c\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
    if (c && countrySlugs.has(c[1]) && (!c[2] || isCategory(c[2]))) continue;
    add(`broken or unknown internal link ${l}`);
  }
  const external = [...p.body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
  if (external.length > 6) add("too many external links (max 6)");
  if (external.some((u) => /bit\.ly|tinyurl|t\.co\//i.test(u))) add("no link shorteners");
  return errs;
}

const argv = process.argv.slice(2);
const all = getAllPosts();
const targets = argv.length
  ? argv.map((f) => parsePost(path.basename(f).replace(/\.md$/, ""), fs.readFileSync(path.isAbsolute(f) ? f : path.join(process.cwd(), f), "utf8")))
  : all;
let failed = 0;
for (const p of targets) {
  const errs = checkPost(p, all);
  if (errs.length) { failed++; console.log(`✗ ${p.slug}`); errs.forEach((e) => console.log(`    - ${e}`)); }
  else console.log(`✓ ${p.slug} (${p.words} words, ${p.date}${p.date > today ? ", scheduled" : ""})`);
}
void BLOG_DIR;
if (failed) { console.log(`\n${failed} post(s) failed.`); process.exit(1); }
console.log(`\nAll ${targets.length} post(s) passed.`);
