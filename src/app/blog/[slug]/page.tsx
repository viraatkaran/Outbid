import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Newsletter from "../../../components/Newsletter";
import { getPost, relatedPosts } from "../../../lib/blog";
import { BRAND, SITE_URL } from "../../../lib/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPost((await params).slug);
  if (!p) return {};
  const url = `/blog/${p.slug}`;
  return {
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    authors: [{ name: p.author }],
    alternates: { canonical: url },
    openGraph: { type: "article", title: p.title, description: p.description, url, publishedTime: p.date, modifiedTime: p.updated ?? p.date, tags: p.tags },
    twitter: { card: "summary_large_image", title: p.title, description: p.description },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  const related = relatedPosts(p);
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.description,
      datePublished: p.date, dateModified: p.updated ?? p.date, keywords: p.keywords.join(", "),
      author: { "@type": "Organization", name: BRAND }, publisher: { "@type": "Organization", name: BRAND, url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: p.title, item: `${SITE_URL}/blog/${p.slug}` },
      ],
    },
  ];
  return (
    <main className="prose">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <p className="crumbs"><Link href="/">Home</Link> › <Link href="/blog">Blog</Link></p>
      <article>
        <h1>{p.title}</h1>
        <p className="meta">{p.date}{p.updated ? ` (updated ${p.updated})` : ""} · {p.minutes} min read{p.tags.map((t) => <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="tag" style={{ marginLeft: 6 }}>{t}</Link>)}</p>
        <div dangerouslySetInnerHTML={{ __html: p.html }} />
      </article>
      <div className="card">
        <strong>Want more customers from your country or category?</strong>
        <p>Pick your country and category and see who ranks at the top. <Link href="/countries">Browse all countries →</Link> · <Link href="/claim">Claim a rank →</Link></p>
      </div>
      {related.length > 0 && (
        <div className="card"><strong>Keep reading</strong><ul>{related.map((r) => <li key={r.slug}><Link href={`/blog/${r.slug}`}>{r.title}</Link></li>)}</ul></div>
      )}
      <div className="card"><strong>Get the weekly worldwide top 10</strong><p /><Newsletter source="post" /></div>
    </main>
  );
}
