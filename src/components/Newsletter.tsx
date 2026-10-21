"use client";
import { useState } from "react";

export default function Newsletter({ source = "site" }: { source?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  return (
    <form
      className="nl"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email");
        const r = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, source }) });
        setState(r.ok ? "ok" : "err");
      }}
    >
      <input name="email" type="email" required placeholder="you@company.com" aria-label="Email" />
      <button className="btn" type="submit">Subscribe</button>
      {state === "ok" && <span>Thanks! You're on the list.</span>}
      {state === "err" && <span className="err">Something went wrong.</span>}
    </form>
  );
}
