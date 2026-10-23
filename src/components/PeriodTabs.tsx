import Link from "next/link";
import { PERIODS, type Period } from "../lib/rank";

export default function PeriodTabs({ base, period, extra = "" }: { base: string; period: Period; extra?: string }) {
  return (
    <div className="tabs" aria-label="Period">
      {PERIODS.map((p) => (
        <Link key={p.key} href={`${base}?period=${p.key}${extra}`} className={"tab" + (p.key === period ? " on" : "")}>{p.label}</Link>
      ))}
    </div>
  );
}
