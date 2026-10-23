import { notFound } from "next/navigation";
import { categoryLabel, fmtUsd } from "../../../lib/config";
import { countryName } from "../../../lib/countries";
import { SCOPE_LABEL } from "../../../lib/pricing";
import { getOrder } from "../../../lib/listings";
import { mockAllowed } from "../../../lib/payments";
import MockPay from "./MockPay";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout", robots: { index: false } };

export default async function Checkout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getOrder(id);
  if (!o || !mockAllowed()) notFound();
  return (
    <main className="prose">
      <h1>Checkout (test mode)</h1>
      <div className="card">
        <p><strong>{o.title}</strong><br />{o.domain}</p>
        <p>Level: <strong>{SCOPE_LABEL[o.scope]}</strong> · {countryName(o.country)} · {categoryLabel(o.category)}</p>
        <p>Amount: <strong>{fmtUsd(o.amount_cents)}</strong></p>
        <p className="meta">No real payment is taken. A live payment provider is connected before launch.</p>
        {o.status === "paid" ? <p>This order is already paid.</p> : <MockPay orderId={o.id} />}
      </div>
    </main>
  );
}
