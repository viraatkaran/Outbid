"use client";
export default function ThemeToggle() {
  return (
    <button
      aria-label="Toggle dark mode"
      className="pill"
      style={{ cursor: "pointer", background: "none", color: "inherit", fontSize: "1.1rem", lineHeight: 1, padding: "5px 11px" }}
      onClick={() => {
        const root = document.documentElement;
        const dark = root.dataset.theme !== "light";
        const next = dark ? "light" : "dark";
        root.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch {}
      }}
    >
      ◐
    </button>
  );
}
