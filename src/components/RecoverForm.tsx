"use client";
import { useState } from "react";

export default function RecoverForm() {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  return (
    <form className="nl" onSubmit={async (e) => {
      e.preventDefault();
      const email = new FormData(e.currentTarget).get("email");
      const r = await fetch("/api/recover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      setState(r.ok ? "ok" : "err");
      if (!r.ok) setMsg((await r.json()).error || "Failed");
    }}>
      <input name="email" type="email" required placeholder="The email you used when listing" aria-label="Email" />
      <button className="btn" type="submit">Email me my link</button>
      {state === "ok" && <p>If that address is on a listing, a link is on its way. Check your inbox.</p>}
      {state === "err" && <p className="err">{msg}</p>}
    </form>
  );
}
