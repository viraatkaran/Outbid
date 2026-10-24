import Link from "next/link";
import Newsletter from "../../components/Newsletter";
import { getPosts } from "../../lib/blog";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Blog: local marketing, SEO and business growth",
  description: "Practical guides on getting more customers online, local SEO, directories and ranking higher, for businesses in every country.",
  alternates: { canonical: "/blog" },
};

export default async function Blog({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const tag = (await searchParams).tag;
  const all = getPosts();
  const tags = [...new Set(all.flatMap((p) => p.tags))].sort();
  const posts = tag ? all.filter((p) => p.tags.includes(tag)) : all;
  return (
    <main className="prose">
      <h1>Blog</h1>
      <div className="chips">
        <Link className={"chip" + (!tag ? " on" : "")} href="/blog">All</Link>
        {tags.map((t) => <Link key={t} className={"chip" + (tag === t ? " on" : "")} href={`/blog?tag=${encodeURIComponent(t)}`}>{t}</Link>)}
      </div>
      {posts.map((p) => (
        <article key={p.slug} className="card">
          <h2 style={{ margin: 0 }}><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
          <p className="meta">{p.date} · {p.minutes} min read</p><p>{p.description}</p>
        </article>
      ))}
      {posts.length === 0 && <div className="card">No posts yet.</div>}
      <div className="card"><strong>Get the weekly worldwide top 10</strong><p /><Newsletter source="blog" /></div>
    </main>
  );
}
