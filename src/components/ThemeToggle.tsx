"use client";
export default function ThemeToggle() {
  return (
    <button
      aria-label="Toggle dark mode"
      className="pill"
      style={{ cursor: "pointer", background: "none", color: "inherit" }}
      onClick={() => {
        const root = document.documentElement;
        const dark = getComputedStyle(root).getPropertyValue("--bg").trim() === "#121212";
        const next = dark ? "light" : "dark";
        root.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch {}
      }}
    >
      ◐
    </button>
  );
}
