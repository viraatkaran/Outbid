import { redirect } from "next/navigation";
import AutoRefresh from "../../../components/AutoRefresh";
import { db } from "../../../lib/db";
import { getOrder, type Listing } from "../../../lib/listings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirming payment", robots: { index: false } };

/** Where Stripe sends the buyer after paying. Waits for the webhook, then forwards to the dashboard or listing. */
export default async function Done({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const id = (await searchParams).order ?? "";
  const order = getOrder(id);
  if (order?.status === "paid" && order.listing_id) {
    const l = db().prepare("SELECT * FROM listings WHERE id = ?").get(order.listing_id) as Listing | undefined;
    if (l) redirect(order.created_listing ? `/manage/${l.owner_token}?new=1` : `/l/${l.slug}`);
  }
  return (
    <main className="prose">
      <h1>Confirming your payment…</h1>
      <p>This usually takes a few seconds. This page will continue by itself.</p>
      {order ? <AutoRefresh /> : <p className="err">We couldn't find this order. If you were charged, email us with your receipt.</p>}
    </main>
  );
}
