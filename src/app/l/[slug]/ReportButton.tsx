"use client";
import { useState } from "react";

export default function ReportButton({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);
  if (done) return <span className="meta">Thanks, we'll review it.</span>;
  return (
    <button className="meta" style={{ background: "none", border: 0, cursor: "pointer", textDecoration: "underline", color: "inherit" }}
      onClick={async () => {
        const reason = window.prompt("What is wrong with this listing?");
        if (!reason) return;
        await fetch("/api/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, reason }) });
        setDone(true);
      }}>Report this listing</button>
  );
}
