export default function SearchForm({ q, placeholder, hidden = {} }: { q?: string; placeholder: string; hidden?: Record<string, string> }) {
  return (
    <form method="get" className="searchbar" role="search">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input className="search" type="search" name="q" defaultValue={q ?? ""} placeholder={placeholder} aria-label={placeholder} />
      <button className="btn" type="submit">Search</button>
    </form>
  );
}
