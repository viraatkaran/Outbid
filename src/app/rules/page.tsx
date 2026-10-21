import { MIN_BID_CENTS, MIN_FIRST_BID_CENTS, fmtUsd } from "../../lib/config";

export const metadata = { title: "Rules, ranking & refunds" };

export default function Rules() {
  return (
    <main className="prose">
      <h1>Rules, ranking &amp; refunds</h1>
      <h2>How ranking works</h2>
      <p>Every listing is ranked by the total amount paid within the period (all-time, this month, this week, today; UTC). Ties go to whoever reached that total first. This is <strong>paid placement</strong>, not an editorial or quality ranking, and every listing is labelled as such.</p>
      <h2>Prices</h2>
      <p>The first payment for a listing is at least {fmtUsd(MIN_FIRST_BID_CENTS)}; each later payment is at least {fmtUsd(MIN_BID_CENTS)}. To raise a rank, pay again with the same URL.</p>
      <h2>Verified clicks</h2>
      <p>Outbound clicks go through our redirect. We store every click but only count the first non-bot click per visitor per listing per day as <em>verified</em>. Known bots and repeat clicks are excluded. Counts are estimates and we make no guarantee of traffic, leads or sales.</p>
      <h2>What can be listed</h2>
      <p>Real, public products, tools and businesses you own or represent. No malware, phishing, adult content, illegal goods, or impersonation. We may hide any listing that breaks these rules; use "Report this listing" on any page.</p>
      <h2>Refunds</h2>
      <p>Payments are for placement and are non-refundable once the listing is live, except where required by law or where we remove a listing that was valid under these rules. Contact us with your order details.</p>
      <p className="meta">Draft rules for the test-mode launch: have them reviewed by a lawyer before taking real payments.</p>
    </main>
  );
}
