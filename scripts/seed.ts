import { db, nowIso } from "../src/lib/db";

// [domain, title, description, category, country, scope, cents]
const demo: [string, string, string, string, string, string, number][] = [
  ["agentforge.example", "AgentForge", "Build and deploy AI agents without code.", "ai-agents", "US", "world", 22000],
  ["kiwipipes.example", "Kiwi Pipes & Drains", "24/7 emergency plumbing across Auckland.", "plumbing", "NZ", "country", 4500],
  ["draftly.example", "Draftly", "AI writing assistant for marketing teams.", "ai-writing", "GB", "world", 15000],
  ["harbourplumb.example", "Harbour Plumbing", "Licensed plumbers in Wellington.", "plumbing", "NZ", "category", 1800],
  ["pixelmint.example", "PixelMint", "Generate product images and short videos.", "ai-image-video", "DE", "country", 6000],
  ["sparkyfix.example", "SparkyFix", "Electricians for homes and offices.", "electrician", "NZ", "category", 2500],
  ["codepilot.example", "CodePilot", "Review and refactor code with AI.", "dev-tools", "IN", "category", 1200],
  ["mumbaidental.example", "Mumbai Dental Care", "Family dentistry in Mumbai.", "dental", "IN", "country", 2400],
];

const d = db();
if ((d.prepare("SELECT COUNT(*) n FROM listings").get() as { n: number }).n > 0) {
  console.log("Database already has listings; skipping seed.");
} else {
  demo.forEach(([domain, title, description, category, country, scope, cents], i) => {
    const info = d.prepare(
      "INSERT INTO listings (slug,url,domain,title,description,category,country,owner_token,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run(domain.split(".")[0], `https://${domain}`, domain, title, description, category, country, `seed-token-${i}`, nowIso());
    d.prepare("INSERT INTO bids (listing_id, amount_cents, scope, payment_ref, created_at) VALUES (?,?,?,?,?)").run(info.lastInsertRowid, cents, scope, `seed_${i}`, nowIso());
  });
  console.log(`Seeded ${demo.length} demo listings (fake data, remove before launch).`);
}
