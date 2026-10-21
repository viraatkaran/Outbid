import { db, nowIso } from "../src/lib/db";

const demo: [string, string, string, string, number][] = [
  ["agentforge.example", "AgentForge", "Build and deploy AI agents without code.", "ai-agents", 12000],
  ["draftly.example", "Draftly", "AI writing assistant for marketing teams.", "ai-writing", 8500],
  ["pixelmint.example", "PixelMint", "Generate product images and short videos.", "ai-image-video", 6000],
  ["codepilot.example", "CodePilot", "Review and refactor code with AI.", "dev-tools", 4200],
  ["seoscout.example", "SEOScout", "Find keywords your competitors miss.", "marketing-seo", 3000],
  ["tasknest.example", "TaskNest", "Tasks and notes that organise themselves.", "productivity", 1500],
];

const d = db();
if ((d.prepare("SELECT COUNT(*) n FROM listings").get() as { n: number }).n > 0) {
  console.log("Database already has listings; skipping seed.");
} else {
  demo.forEach(([domain, title, description, category, cents], i) => {
    const info = d.prepare(
      "INSERT INTO listings (slug,url,domain,title,description,category,owner_token,created_at) VALUES (?,?,?,?,?,?,?,?)",
    ).run(domain.split(".")[0], `https://${domain}`, domain, title, description, category, `seed-token-${i}`, nowIso());
    d.prepare("INSERT INTO bids (listing_id, amount_cents, payment_ref, created_at) VALUES (?,?,?,?)").run(info.lastInsertRowid, cents, `seed_${i}`, nowIso());
  });
  console.log(`Seeded ${demo.length} demo listings (fake data, remove before launch).`);
}
