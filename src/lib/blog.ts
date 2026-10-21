import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

export type Post = { slug: string; title: string; date: string; description: string; tags: string[]; html: string };

const DIR = path.join(process.cwd(), "content", "blog");

function parse(file: string): Post {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fm: Record<string, string> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return {
    slug: file.replace(/\.md$/, ""),
    title: fm.title || file,
    date: fm.date || "1970-01-01",
    description: fm.description || "",
    tags: (fm.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    html: marked.parse(m?.[2] ?? raw, { async: false }) as string,
  };
}

export function getPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).map(parse).sort((a, b) => b.date.localeCompare(a.date));
}
export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);
