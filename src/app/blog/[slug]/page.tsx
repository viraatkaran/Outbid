import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Newsletter from "../../../components/Newsletter";
import { getPost, getPosts } from "../../../lib/blog";

export function generateStaticParams() { return getPosts().map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPost((await params).slug);
  return p ? { title: p.title, description: p.description, openGraph: { type: "article", publishedTime: p.date } } : {};
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  return (
    <main className="prose">
      <article>
        <h1>{p.title}</h1>
        <p className="meta">{p.date}{p.tags.map((t) => <span key={t} className="tag" style={{ marginLeft: 6 }}>{t}</span>)}</p>
        <div dangerouslySetInnerHTML={{ __html: p.html }} />
      </article>
      <div className="card"><strong>Get the weekly top-10 of AI tools &amp; SaaS</strong><p /><Newsletter source="post" /></div>
    </main>
  );
}
