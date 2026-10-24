"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type Option = { value: string; label: string; group?: string };

/**
 * A select you can type into: click it, start typing ("plumb"), and pick from the filtered list.
 * Works with the keyboard (arrows, Enter, Escape) and with a screen reader (combobox + listbox).
 */
export default function SearchSelect({
  options, value, onChange, placeholder, label,
}: { options: Option[]; value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || (o.group ?? "").toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => setActive(0), [query, open]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  const pick = (o: Option) => { onChange(o.value); setQuery(""); setOpen(false); };
  const groups = [...new Set(shown.map((o) => o.group ?? ""))];

  return (
    <div className="ss" ref={root}>
      <input
        className="ss-input"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={open ? query : selected?.label ?? ""}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, shown.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open && shown[active]) { e.preventDefault(); pick(shown[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      <span className="ss-caret" aria-hidden="true">▾</span>
      {open && (
        <ul className="ss-list" id={listId} role="listbox" aria-label={label}>
          {shown.length === 0 && <li className="ss-empty">Nothing matches "{query}"</li>}
          {groups.map((g) => (
            <li key={g || "all"} role="presentation">
              {g && <div className="ss-group">{g}</div>}
              <ul role="presentation">
                {shown.filter((o) => (o.group ?? "") === g).map((o) => {
                  const idx = shown.indexOf(o);
                  return (
                    <li
                      key={o.value} id={`${listId}-${idx}`} role="option" aria-selected={o.value === value}
                      className={"ss-opt" + (idx === active ? " active" : "") + (o.value === value ? " chosen" : "")}
                      onMouseEnter={() => setActive(idx)}
                      onMouseDown={(e) => { e.preventDefault(); pick(o); }}
                    >
                      {o.label}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
