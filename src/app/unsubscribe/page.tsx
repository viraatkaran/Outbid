export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="prose">
      <h1>Unsubscribe</h1>
      {sp.done ? <p>You're unsubscribed. You won't get the weekly email.</p> : (
        <form method="post" action="/api/unsubscribe">
          <input type="hidden" name="token" value={sp.token ?? ""} />
          <p>Stop the weekly top-10 email?</p>
          <button className="btn" type="submit">Yes, unsubscribe me</button>
        </form>
      )}
    </main>
  );
}
