"use client";
import Link from "next/link";
import { useState } from "react";

export type FinderItem = { href: string; label: string; badge?: string; group?: string };

/** Search box that filters a long list of links as you type (countries or categories). */
export default function Finder({ items, placeholder, grouped = false }: { items: FinderItem[]; placeholder: string; grouped?: boolean }) {
  const [q, setQ] = useState("");
  const shown = items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()));
  const groups = grouped ? [...new Set(shown.map((i) => i.group ?? ""))] : [""];
  return (
    <div>
      <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {shown.length === 0 && <p className="meta">Nothing matches "{q}".</p>}
      {groups.map((g) => (
        <div key={g}>
          {grouped && g && <h4 className="group">{g}</h4>}
          <div className="chips">
            {shown.filter((i) => !grouped || (i.group ?? "") === g).map((i) => (
              <Link key={i.href} href={i.href} className="chip">{i.label}{i.badge ? <em>{i.badge}</em> : null}</Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
