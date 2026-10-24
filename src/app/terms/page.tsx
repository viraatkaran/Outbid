import { BRAND } from "../../lib/config";

export const metadata = { title: "Terms of service", description: "The rules for listing a business and paying for a ranking.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <main className="prose">
      <h1>Terms of service</h1>
      <p className="meta">Last updated 24 October 2026</p>
      <p>By listing a business or paying for a ranking on {BRAND} you agree to these terms and to our <a href="/rules">ranking rules</a> and <a href="/privacy">privacy policy</a>.</p>
      <h2>The service</h2>
      <p>{BRAND} sells <strong>paid placement</strong> in public rankings at category, country and worldwide level. A higher rank means more was paid, not that a business is better. We make no promise of traffic, leads or sales, and click counts are estimates.</p>
      <h2>Your listing</h2>
      <p>You confirm that you own or represent the business and website you list, that the website is real and lawful, and that the listing does not infringe anyone's rights or mislead people. We may hide or remove any listing that breaks these terms or our rules.</p>
      <h2>Payments</h2>
      <p>Prices are shown in US dollars before you pay. Payments are processed by Stripe. Placement starts when payment is confirmed. Payments are non-refundable once the listing is live, except where the law requires otherwise or where we remove a listing that was valid under our rules. Your bank may charge conversion fees.</p>
      <h2>Your dashboard link</h2>
      <p>Your private dashboard link is the key to your listing. Keep it safe: anyone who has it can change your alert settings and raise your rank. We can email it to the address saved on your listing.</p>
      <h2>Acceptable use</h2>
      <p>No malware, phishing, adult content, illegal goods or services, impersonation, fake clicks or attempts to manipulate rankings or our click counts.</p>
      <h2>Liability</h2>
      <p>The service is provided as is. To the extent the law allows, we are not liable for indirect or lost profits, and our total liability is limited to the amount you paid us in the 12 months before the claim. Nothing here limits rights you have under consumer law that cannot be excluded.</p>
      <h2>Changes and law</h2>
      <p>We may update these terms; the date above shows the latest version. These terms are governed by the laws of New Zealand.</p>
      <p>Questions? <a href="/contact">Contact us</a>.</p>
    </main>
  );
}
