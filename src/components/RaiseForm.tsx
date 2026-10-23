"use client";
import { useState } from "react";
import { SCOPES, SCOPE_LABEL, type Scope } from "../lib/pricing";

export type RaiseOption = { scope: Scope; minCents: number; suggestCents: number; note: string };
const usd = (c: number) => "$" + (c / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function RaiseForm({ url, options }: { url: string; options: RaiseOption[] }) {
  const byScope = Object.fromEntries(options.map((o) => [o.scope, o])) as Record<Scope, RaiseOption>;
  const [scope, setScope] = useState<Scope>("category");
  const [amount, setAmount] = useState(byScope.category.suggestCents / 100);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const o = byScope[scope];

  async function go() {
    setBusy(true); setErr("");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, scope, amountCents: Math.round(amount * 100) }) });
    const j = await r.json();
    if (r.ok) window.location.href = j.checkoutUrl; else { setErr(j.error || "Failed"); setBusy(false); }
  }

  return (
    <div>
      <div className="levels">
        {SCOPES.map((s) => (
          <label key={s} className={"level" + (scope === s ? " on" : "")}>
            <input type="radio" name="raise" checked={scope === s} onChange={() => { setScope(s); setAmount(byScope[s].suggestCents / 100); }} />
            <b>{SCOPE_LABEL[s]}</b>
            <span className="from">min {usd(byScope[s].minCents)}</span>
            <small>{byScope[s].note}</small>
          </label>
        ))}
      </div>
      <div className="claim">
        <div className="stepper" style={{ flex: "1 1 220px" }}>
          <button type="button" onClick={() => setAmount((a) => Math.max(o.minCents / 100, a - 1))}>−</button>
          <span className="price" style={{ fontSize: "1.6rem", fontWeight: 800 }}>${amount.toLocaleString()}</span>
          <button type="button" onClick={() => setAmount((a) => a + 1)}>+</button>
        </div>
        <button className="btn" disabled={busy || amount * 100 < o.minCents} onClick={go}>{busy ? "…" : `Pay ${usd(amount * 100)} at ${SCOPE_LABEL[scope]} level`}</button>
      </div>
      <div className="err">{err}</div>
    </div>
  );
}
