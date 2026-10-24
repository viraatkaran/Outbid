"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sends one anonymous page view per navigation to our own /api/hit. */
export default function Beacon() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    fetch("/api/hit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path, ref: document.referrer }), keepalive: true }).catch(() => {});
  }, [path]);
  return null;
}
