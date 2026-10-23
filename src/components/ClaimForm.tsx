"use client";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_GROUPS, categoryLabel } from "../lib/config";
import { COUNTRIES, countryName, getCountry } from "../lib/countries";
import { SCOPES, SCOPE_HELP, SCOPE_LABEL, floorCents, type Scope } from "../lib/pricing";

type Quote = { floors: Record<Scope, number>; leaders: Record<Scope, number> };
const usd = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function ClaimForm({ defaults }: { defaults?: { country?: string; category?: string; scope?: Scope; url?: string } }) {
  const [url, setUrl] = useState(defaults?.url ?? "");
  const [country, setCountry] = useState(defaults?.country ?? "");
  const [category, setCategory] = useState(defaults?.category ?? "");
  const [scope, setScope] = useState<Scope>(defaults?.scope ?? "category");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(5);
  const [touched, setTouched] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Guess the visitor's country from their browser language when none was given.
  useEffect(() => {
    if (country) return;
    const region = navigator.language?.split("-")[1]?.toUpperCase();
    setCountry(region && getCountry(region) ? region : "US");
  }, [country]);

  const floors = useMemo<Record<Scope, number>>(
    () => ({ category: floorCents("category", country), country: floorCents("country", country), world: floorCents("world", country) }),
    [country],
  );

  useEffect(() => {
    if (!country) return;
    const ctl = new AbortController();
    fetch(`/api/quote?country=${country}&category=${category}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then(setQuote)
      .catch(() => {});
    return () => ctl.abort();
  }, [country, category]);

  // Until the visitor edits the amount, suggest the price that takes #1 at the chosen level.
  useEffect(() => {
    if (touched) return;
    const leader = quote?.leaders[scope] ?? 0;
    setAmount(Math.max(floors[scope] / 100, leader ? Math.floor(leader / 100) + 1 : 0));
  }, [scope, quote, floors, touched]);

  const where = scope === "world" ? "worldwide" : scope === "country" ? `in ${countryName(country) || "…"}` : `in ${category ? categoryLabel(category) : "a category"} · ${countryName(country) || "…"}`;
  const bump = (n: number) => { setTouched(true); setAmount((a) => Math.max(1, a + n)); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, country, category, scope, amountCents: Math.round(amount * 100), email }),
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
          Claim #1 {where} for{" "}
          <span className="stepper">
            <button type="button" aria-label="Decrease" onClick={() => bump(-1)}>−</button>
            <span className="price" key={amount}>${amount.toLocaleString()}</span>
            <button type="button" aria-label="Increase" onClick={() => bump(1)}>+</button>
          </span>
        </h1>
        <p className="quick">
          {[5, 25, 100].map((n) => <button type="button" key={n} onClick={() => bump(n)}>+${n}</button>)}
        </p>
      </div>

      <div className="levels" role="radiogroup" aria-label="Ranking level">
        {SCOPES.map((s) => (
          <label key={s} className={"level" + (scope === s ? " on" : "")}>
            <input type="radio" name="scope" checked={scope === s} onChange={() => { setScope(s); setTouched(false); }} />
            <b>{SCOPE_LABEL[s]}</b>
            <span className="from">from {usd(floors[s])}</span>
            <small>{SCOPE_HELP[s]}</small>
            <small className="lead">{quote?.leaders[s] ? `Top bid: ${usd(quote.leaders[s])}` : "No bids yet: be first"}</small>
          </label>
        ))}
      </div>

      <div className="claim">
        <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="Your website URL or @handle" aria-label="Website URL" />
        <select value={country} onChange={(e) => { setCountry(e.target.value); setTouched(false); }} required aria-label="Country">
          <option value="">Choose a country</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setTouched(false); }} required aria-label="Category">
          <option value="">Choose a category</option>
          {CATEGORY_GROUPS.map((g) => (
            <optgroup key={g.name} label={g.name}>{g.items.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</optgroup>
          ))}
        </select>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email for your dashboard and outbid alerts" aria-label="Email" />
        <button className="btn" disabled={busy || !url || !country || !category}>{busy ? "…" : "Claim rank"}</button>
      </div>
      <p className="hint">Already listed? Enter the same URL again to raise your rank at any level. Country and category stay as first chosen.</p>
      <div className="err" role="alert">{err}</div>
    </form>
  );
}
