"use client";
import { useState } from "react";

export default function MockPay({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <>
      <button className="btn" disabled={busy} onClick={async () => {
        setBusy(true);
        const r = await fetch("/api/checkout/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId }) });
        const j = await r.json();
        if (r.ok) window.location.href = j.redirect; else { setErr(j.error || "Failed"); setBusy(false); }
      }}>Pay (test mode)</button>
      <div className="err">{err}</div>
    </>
  );
}
