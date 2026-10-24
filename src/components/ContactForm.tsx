"use client";
import { useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setState("busy");
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      if (r.ok) setState("ok"); else { setState("err"); setMsg((await r.json()).error || "Something went wrong."); }
    }}>
      {state === "ok" ? <div className="card">Thanks! Your message is in. We'll reply by email.</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          <input className="field" name="name" required placeholder="Your name" aria-label="Your name" />
          <input className="field" name="email" type="email" required placeholder="Your email" aria-label="Your email" />
          <textarea className="field" name="message" required minLength={10} rows={6} placeholder="How can we help? For billing questions include your listing URL." aria-label="Message" style={{ borderRadius: 14, resize: "vertical" }} />
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, height: 0, width: 0, opacity: 0 }} />
          <div><button className="btn" disabled={state === "busy"} type="submit">{state === "busy" ? "…" : "Send message"}</button></div>
          {state === "err" && <div className="err">{msg}</div>}
        </div>
      )}
    </form>
  );
}
