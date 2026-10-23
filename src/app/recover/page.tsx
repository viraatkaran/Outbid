import RecoverForm from "../../components/RecoverForm";

export const metadata = { title: "Find my dashboard", robots: { index: false } };

export default function Recover() {
  return (
    <main className="prose">
      <h1>Find my dashboard</h1>
      <p>Enter the email you used when you listed. We'll send your private dashboard link there.</p>
      <RecoverForm />
    </main>
  );
}
