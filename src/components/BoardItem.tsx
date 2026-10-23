import Link from "next/link";
import type { BoardRow } from "../lib/rank";
import { categoryLabel, fmtUsd } from "../lib/config";

export default function BoardItem({ row, rank }: { row: BoardRow; rank: number }) {
  return (
    <div className={"item" + (rank === 1 ? " top" : "") + (rank <= 3 ? ` r${rank}` : "")} style={{ "--i": Math.min(rank, 12) } as React.CSSProperties}>
      <div className="rank">#{rank}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-img" alt="" loading="lazy" src={`https://www.google.com/s2/favicons?domain=${row.domain}&sz=128`} />
      <div className="body">
        <h3>
          <Link href={`/l/${row.slug}`}>{row.title}</Link>
          <span className="amt">{fmtUsd(row.total_cents)}</span>
        </h3>
        <p>{row.description || row.domain}</p>
        <div className="meta">
          {categoryLabel(row.category)} · {" "}
          <a href={`/go/${row.slug}`} target="_blank" rel="sponsored nofollow noopener">{row.domain}</a> · {row.clicks.toLocaleString()} verified clicks
          <span className="sponsored">paid placement</span>
        </div>
      </div>
    </div>
  );
}
