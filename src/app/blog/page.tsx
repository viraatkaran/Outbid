import Link from "next/link";
import Newsletter from "../../components/Newsletter";
import { getPosts } from "../../lib/blog";

export const metadata = { title: "Blog", description: "Guides, teardowns and weekly rankings for AI tools and SaaS." };

export default function Blog() {
  return (
    <main className="prose">
      <h1>Blog</h1>
      {getPosts().map((p) => (
        <article key={p.slug} className="card">
          <h2 style={{ margin: 0 }}><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
          <p className="meta">{p.date}</p><p>{p.description}</p>
        </article>
      ))}
      <div className="card"><strong>Get the weekly top-10</strong><p /><Newsletter source="blog" /></div>
    </main>
  );
}
