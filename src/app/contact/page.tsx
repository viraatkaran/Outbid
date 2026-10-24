import ContactForm from "../../components/ContactForm";

export const metadata = { title: "Contact us", description: "Questions about rankings, payments or your listing? Send us a message.", alternates: { canonical: "/contact" } };

export default function Contact() {
  return (
    <main className="prose">
      <h1>Contact us</h1>
      <p>Questions about a ranking, a payment or your listing? Send us a message and we'll reply by email. If you lost your dashboard link, you can <a href="/recover">get it again here</a>.</p>
      <ContactForm />
    </main>
  );
}
