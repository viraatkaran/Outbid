import { redirect } from "next/navigation";
import { currentAdmin } from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false } };

const ERRORS: Record<string, string> = {
  denied: "That Google account is not allowed to open the dashboard.",
  not_configured: "Google sign-in is not set up yet (missing GOOGLE_CLIENT_ID).",
  state: "The sign-in session expired. Please try again.",
  token: "Google sign-in failed. Please try again.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const error = (await searchParams).error;
  return (
    <main style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
      <h1>Admin dashboard</h1>
      <p>Only approved Google accounts can sign in.</p>
      {error && <p role="alert" style={{ color: "#c0392b" }}>{ERRORS[error] ?? "Sign-in failed."}</p>}
      <a className="btn" href="/api/auth/google" style={{ display: "inline-block", marginTop: 12 }}>Sign in with Google</a>
    </main>
  );
}
