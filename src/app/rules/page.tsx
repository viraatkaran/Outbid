import { fmtUsd } from "../../lib/config";
import { BASE_FLOOR_CENTS, MIN_RAISE_CENTS, floorCents } from "../../lib/pricing";

export const metadata = { title: "Rules, ranking & refunds" };

export default function Rules() {
  return (
    <main className="prose">
      <h1>Rules, ranking &amp; refunds</h1>
      <h2>Three levels of ranking</h2>
      <p>Every business lists in one country and one category, and can pay at three levels:</p>
      <ul>
        <li><strong>Category:</strong> the board for one category in one country, for example Plumbing in New Zealand.</li>
        <li><strong>Country:</strong> the board for all categories in a country (top 100).</li>
        <li><strong>Worldwide:</strong> the global board (top 100).</li>
      </ul>
      <p>A payment counts on its own board and every board below it. Worldwide payments also count on your country and category boards, and country payments also count on your category board. Category payments count on the category board only.</p>
      <h2>How ranks are decided</h2>
      <p>Each board ranks by the total paid in the chosen period (all-time, this month, this week or today; UTC; weeks start on Monday). Ties go to whoever reached that total first. This is <strong>paid placement</strong>, not an editorial or quality ranking, and every listing is labelled as such.</p>
      <h2>Starting prices</h2>
      <p>The first payment at each level must reach the starting price. After that, each extra payment at that level is at least {fmtUsd(MIN_RAISE_CENTS)}. Category and country prices depend on the country's income level; worldwide is the same everywhere.</p>
      <table><thead><tr><th>Level</th><th>High income countries</th><th>Middle income</th><th>Lower income</th></tr></thead><tbody>
        <tr><td>Category</td><td>{fmtUsd(floorCents("category", "US"))}</td><td>{fmtUsd(floorCents("category", "BR"))}</td><td>{fmtUsd(floorCents("category", "KE"))}</td></tr>
        <tr><td>Country</td><td>{fmtUsd(floorCents("country", "US"))}</td><td>{fmtUsd(floorCents("country", "BR"))}</td><td>{fmtUsd(floorCents("country", "KE"))}</td></tr>
        <tr><td>Worldwide</td><td colSpan={3}>{fmtUsd(BASE_FLOOR_CENTS.world)} everywhere</td></tr>
      </tbody></table>
      <h2>Verified clicks</h2>
      <p>Outbound clicks go through our redirect. We store every click but only count the first non-bot click per visitor per listing per day as <em>verified</em>. Known bots and repeat clicks are excluded. Counts are estimates and we make no guarantee of traffic, leads or sales.</p>
      <h2>What can be listed</h2>
      <p>Real, public businesses, products and tools that you own or represent. No malware, phishing, adult content, illegal goods or impersonation. We may hide any listing that breaks these rules; use "Report this listing" on any page.</p>
      <h2>Emails</h2>
      <p>If you give an email we send a receipt with your private dashboard link and an alert when another business passes you on a board (at most one alert per board per day). You can turn alerts off in your dashboard. Newsletter emails have an unsubscribe link.</p>
      <h2>Refunds</h2>
      <p>Payments are for placement and are non-refundable once the listing is live, except where required by law or where we remove a listing that was valid under these rules. Contact us with your order details.</p>
      <p className="meta">Draft rules for the test-mode launch: have them reviewed by a lawyer before taking real payments.</p>
    </main>
  );
}
