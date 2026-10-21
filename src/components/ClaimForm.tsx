"use client";
import { useState } from "react";

type Cat = { slug: string; label: string };

export default function ClaimForm({ categories, leaderCents, defaultCategory }: { categories: Cat[]; leaderCents: number; defaultCategory?: string }) {
  const suggested = Math.max(5, Math.floor(leaderCents / 100) + 1);
  const [amount, setAmount] = useState(suggested);
  const [url, setUrl] = useState("");
  const [cat, setCat] = useState(defaultCategory ?? "");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, category: cat, amountCents: Math.round(amount * 100), email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      window.location.href = j.checkoutUrl;
    } catch (e) {
      setErr((e as Error).message); setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="hero">
        <h1>
          Claim #1 for{" "}
          <span className="stepper">
            <button type="button" aria-label="Decrease" onClick={() => setAmount((a) => Math.max(1, a - 1))}>−</button>
            <span className="price">${amount.toLocaleString()}</span>
            <button type="button" aria-label="Increase" onClick={() => setAmount((a) => a + 1)}>+</button>
          </span>
        </h1>
      </div>
      <div className="claim">
        <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="Your product URL or @handle" aria-label="Product URL" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} required aria-label="Category">
          <option value="">Choose a category</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email for outbid alerts (optional)" aria-label="Email" />
        <button className="btn" disabled={busy || !url || !cat}>{busy ? "…" : "Claim rank"}</button>
      </div>
      <div className="err" role="alert">{err}</div>
    </form>
  );
}
