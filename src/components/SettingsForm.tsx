"use client";
import { useState } from "react";

export default function SettingsForm({ token, email, alerts }: { token: string; email: string; alerts: boolean }) {
  const [e, setE] = useState(email);
  const [a, setA] = useState(alerts);
  const [msg, setMsg] = useState("");
  return (
    <form className="nl" onSubmit={async (ev) => {
      ev.preventDefault();
      const r = await fetch("/api/manage/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, email: e, alerts: a }) });
      setMsg(r.ok ? "Saved." : (await r.json()).error || "Failed");
    }}>
      <input type="email" value={e} onChange={(x) => setE(x.target.value)} placeholder="you@company.com" aria-label="Email" />
      <label className="meta" style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input type="checkbox" checked={a} onChange={(x) => setA(x.target.checked)} style={{ flex: "none" }} /> Email me when I'm outbid
      </label>
      <button className="btn" type="submit">Save</button>
      {msg && <span className="meta">{msg}</span>}
    </form>
  );
}
