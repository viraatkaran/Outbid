import { BRAND } from "../../lib/config";

export const metadata = { title: "Privacy policy", description: "What data we collect, why, and who we share it with.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <main className="prose">
      <h1>Privacy policy</h1>
      <p className="meta">Last updated 24 October 2026</p>
      <p>{BRAND} is a paid-placement ranking of businesses by country and category. This page explains what personal data we handle and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li><strong>Listing details</strong> you give us: website address, country, category, and the title and description we read from your website. These are shown publicly.</li>
        <li><strong>Your email address</strong>, if you give it. We use it for your receipt, your private dashboard link, outbid alerts, and replies to your messages.</li>
        <li><strong>Payment details.</strong> Payments are handled by Stripe. We never see or store your card number. We keep the order, the amount and Stripe's payment reference.</li>
        <li><strong>Visitor click data.</strong> When someone clicks through to a listing we record the time, the country, the referring site and a one-way scrambled fingerprint of their network address and browser (it changes daily and cannot be turned back into an address). It is used to count verified clicks and spot bots.</li>
        <li><strong>Newsletter signups</strong>: your email and the page you signed up on.</li>
        <li><strong>Messages</strong> you send through the contact form.</li>
      </ul>
      <h2>Cookies and similar storage</h2>
      <p>We do not use advertising or tracking cookies. Your browser stores one small setting (light or dark theme) on your device. We count page views with our own simple analytics: the page visited, the referring site, your device type and browser language region, plus a one-way daily hash of your IP address and browser that cannot be reversed and changes every day. We do not store your IP address or share this data with advertisers.</p>
      <h2>Who we share data with</h2>
      <ul>
        <li><strong>Stripe</strong> (payments), <strong>Resend</strong> (sending email), and <strong>Railway</strong> (hosting and database).</li>
        <li><strong>Google</strong>: listing logos are loaded from Google's favicon service, which receives the listed website's domain (not your personal data).</li>
        <li>Authorities, where the law requires it. We do not sell personal data.</li>
      </ul>
      <h2>How long we keep it</h2>
      <p>Listing and payment records are kept for as long as needed to run the ranking and meet accounting and legal duties. Click records are kept for analytics. You can ask us to delete your email address, or to remove a listing, at any time.</p>
      <h2>Your rights</h2>
      <p>You can ask to see, correct or delete the personal data we hold about you, and unsubscribe from the newsletter with one click from any email. Use the <a href="/contact">contact form</a> and we'll respond promptly. If you are in the EU, UK or New Zealand you may also complain to your data protection authority.</p>
      <h2>International transfers</h2>
      <p>Our providers may process data in other countries. We choose providers that protect it appropriately.</p>
    </main>
  );
}
