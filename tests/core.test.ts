process.env.DATABASE_PATH = ":memory:";
delete process.env.RESEND_API_KEY;
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUrl } from "../src/lib/url";
import { isPrivateIp } from "../src/lib/metadata";
import { isBot, recordClick, listingAnalytics } from "../src/lib/track";
import { ValidationError, createOrder, fulfillOrder } from "../src/lib/listings";
import { completeOrder, sendDashboardLinks } from "../src/lib/notify";
import { getBoard, getRank, periodStart, countryListingCounts } from "../src/lib/rank";
import { COUNTRIES, getCountryBySlug, isCountryCode } from "../src/lib/countries";
import { floorCents, type Scope } from "../src/lib/pricing";
import { CATEGORIES, isCategory } from "../src/lib/config";
import { db } from "../src/lib/db";
import { parsePost } from "../src/lib/blog";
import crypto from "node:crypto";
import { isAllowed, signSession, verifySession } from "../src/lib/adminAuth";
import { verifyStripeSignature } from "../src/lib/stripe";

const tick = () => new Promise((r) => setTimeout(r, 60));
const mails = (to?: string) =>
  (db().prepare("SELECT * FROM outbox ORDER BY id").all() as { to_email: string; subject: string; body: string }[]).filter((m) => !to || m.to_email === to);

async function pay(url: string, cents: number, o: { scope?: Scope; country?: string; category?: string; email?: string } = {}) {
  const { orderId } = await createOrder({
    urlInput: url, category: o.category ?? "plumbing", country: o.country ?? "NZ", scope: o.scope ?? "category", amountCents: cents, email: o.email ?? null,
  });
  const r = await completeOrder(orderId, "ref_" + orderId);
  await tick();
  return r;
}

test("normalizeUrl", () => {
  assert.deepEqual(normalizeUrl("WWW.Example.com/"), { url: "https://example.com", domain: "example.com" });
  assert.equal(normalizeUrl("@elon")?.url, "https://x.com/elon");
  for (const bad of ["localhost", "http://127.0.0.1", "javascript:alert(1)", "nodots", "", "https://user:pw@a.com"]) assert.equal(normalizeUrl(bad), null, bad);
});

test("private IPs blocked", () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "192.168.1.1", "172.16.0.1", "169.254.169.254", "::1"]) assert.ok(isPrivateIp(ip), ip);
  assert.ok(!isPrivateIp("8.8.8.8"));
});

test("periodStart week is Monday", () => {
  assert.equal(periodStart("week", new Date("2026-10-21T10:00:00Z")), "2026-10-19T00:00:00.000Z");
  assert.equal(periodStart("all"), null);
});

test("countries and categories", () => {
  assert.ok(COUNTRIES.length > 190);
  assert.ok(isCountryCode("NZ") && !isCountryCode("KP") && !isCountryCode("XX"));
  assert.equal(getCountryBySlug("new-zealand")?.code, "NZ");
  assert.equal(new Set(COUNTRIES.map((c) => c.slug)).size, COUNTRIES.length, "unique slugs");
  assert.ok(CATEGORIES.length > 100 && isCategory("plumbing") && isCategory("it-services") && !isCategory("nope"));
  assert.equal(new Set(CATEGORIES.map((c) => c.slug)).size, CATEGORIES.length, "unique category slugs");
});

test("starting prices by level and country income", () => {
  assert.equal(floorCents("category", "US"), 500);
  assert.equal(floorCents("country", "US"), 2900);
  assert.equal(floorCents("world", "US"), 9900);
  assert.equal(floorCents("world", "KE"), 9900, "worldwide is the same everywhere");
  assert.ok(floorCents("category", "BR") < floorCents("category", "US"));
  assert.ok(floorCents("country", "KE") < floorCents("country", "BR"));
  assert.ok(floorCents("category", "KE") >= 200);
});

test("minimum for the first payment at each level, then $1 raises", async () => {
  const mk = (cents: number, scope: Scope) => createOrder({ urlInput: "floor-offline.invalid", category: "plumbing", country: "NZ", scope, amountCents: cents });
  await assert.rejects(mk(499, "category"), ValidationError);
  await pay("floor-offline.invalid", 500);
  await mk(100, "category"); // raise at an already-paid level
  await assert.rejects(mk(2899, "country"), ValidationError, "first payment at a new level needs that level's starting price");
  await assert.rejects(mk(9899, "world"), ValidationError);
  await mk(9900, "world");
  await assert.rejects(createOrder({ urlInput: "x-offline.invalid", category: "nope", country: "NZ", scope: "category", amountCents: 1000 }), ValidationError);
  await assert.rejects(createOrder({ urlInput: "x-offline.invalid", category: "plumbing", country: "KP", scope: "category", amountCents: 1000 }), ValidationError);
});

test("payments count on their own level and every level below", async () => {
  await pay("cat-only-offline.invalid", 2000, { category: "electrician", scope: "category" });
  await pay("country-offline.invalid", 3000, { category: "electrician", scope: "country" });
  await pay("world-offline.invalid", 10000, { category: "legal", scope: "world" });
  const world = getBoard({ scope: "world", period: "all" }).map((r) => r.domain);
  assert.deepEqual(world, ["world-offline.invalid"]);
  const nz = getBoard({ scope: "country", country: "NZ", period: "all" }).map((r) => r.domain);
  assert.deepEqual(nz.slice(0, 2), ["world-offline.invalid", "country-offline.invalid"]);
  assert.ok(!nz.includes("cat-only-offline.invalid"), "category payments do not count on the country board");
  const elec = getBoard({ scope: "category", country: "NZ", category: "electrician", period: "all" }).map((r) => r.domain);
  assert.deepEqual(elec, ["country-offline.invalid", "cat-only-offline.invalid"], "country payments count on the category board; legal listing is not in this category");
  const legal = getBoard({ scope: "category", country: "NZ", category: "legal", period: "all" });
  assert.equal(legal.length, 1);
  assert.equal(getBoard({ scope: "country", country: "US", period: "all" }).length, 0, "boards are per country");
  assert.ok(countryListingCounts().NZ >= 4);
});

test("search finds listings by name or domain and escapes wildcards", async () => {
  await pay("searchable-offline.invalid", 700, { category: "dental" });
  const hit = getBoard({ scope: "category", country: "NZ", category: "dental", period: "all", q: "searchable" });
  assert.equal(hit.length, 1);
  assert.equal(getBoard({ scope: "category", country: "NZ", category: "dental", period: "all", q: "zzz" }).length, 0);
  assert.equal(getBoard({ scope: "category", country: "NZ", category: "dental", period: "all", q: "%" }).length, 0, "% is not a wildcard");
});

test("ties go to the earlier payer; fulfilling twice adds one bid", async () => {
  await pay("tie-a-offline.invalid", 1000, { category: "roofing" });
  await pay("tie-b-offline.invalid", 1000, { category: "roofing" });
  const b = getBoard({ scope: "category", country: "NZ", category: "roofing", period: "all" });
  assert.equal(b[0].domain, "tie-a-offline.invalid");
  const { orderId } = await createOrder({ urlInput: "dup-offline.invalid", category: "roofing", country: "NZ", scope: "category", amountCents: 700 });
  fulfillOrder(orderId, "dup"); fulfillOrder(orderId, "dup");
  assert.equal(getBoard({ scope: "category", country: "NZ", category: "roofing", period: "all" }).find((r) => r.domain === "dup-offline.invalid")?.total_cents, 700);
});

test("outbid email goes once per board per day, and the receipt never leaks a dashboard link", async () => {
  await pay("alice-offline.invalid", 1000, { category: "cafes", email: "alice@example.com" });
  await pay("bob-offline.invalid", 800, { category: "cafes", email: "bob@example.com" });
  assert.equal(mails("alice@example.com").filter((m) => m.subject.includes("outbid")).length, 0, "bob is below alice, so no alert");
  assert.ok(mails("alice@example.com").some((m) => m.subject.includes("You're live")), "receipt with dashboard link for the owner");
  assert.ok(mails("alice@example.com")[0].body.includes("/manage/"));

  await pay("bob-offline.invalid", 500, { category: "cafes" }); // bob now 1300, passes alice
  const alert = mails("alice@example.com").filter((m) => m.subject.includes("outbid"));
  assert.equal(alert.length, 1);
  assert.ok(alert[0].body.includes("#2"));

  await pay("bob-offline.invalid", 500, { category: "cafes" }); // already ahead: no new alert
  assert.equal(mails("alice@example.com").filter((m) => m.subject.includes("outbid")).length, 1);

  // someone else paying for alice's listing with their own email must not receive her private link
  await pay("alice-offline.invalid", 100, { category: "cafes", email: "mallory@example.com" });
  assert.equal(mails("mallory@example.com").length, 0);

  // alerts can be switched off
  db().prepare("UPDATE listings SET alerts = 0 WHERE domain = 'alice-offline.invalid'").run();
  await pay("carol-offline.invalid", 9000, { category: "cafes" });
  assert.equal(mails("alice@example.com").filter((m) => m.subject.includes("outbid")).length, 1, "no new alert once switched off");
});

test("dashboard links are sent only to the saved email", async () => {
  await sendDashboardLinks("bob@example.com");
  await sendDashboardLinks("nobody@example.com");
  assert.ok(mails("bob@example.com").some((m) => m.subject.includes("dashboard link")));
  assert.equal(mails("nobody@example.com").length, 0);
});

test("click verification dedupes and filters bots", async () => {
  await pay("clicks-offline.invalid", 500, { category: "bakeries" });
  const row = getBoard({ scope: "category", country: "NZ", category: "bakeries", period: "all" })[0];
  const c = { listingId: row.id, ip: "1.2.3.4", referrer: "https://news.ycombinator.com/x", country: "us" };
  recordClick({ ...c, ua: "Mozilla/5.0" });
  recordClick({ ...c, ua: "Mozilla/5.0" });
  recordClick({ ...c, ua: "Googlebot/2.1" });
  const a = listingAnalytics(row.id);
  assert.equal(a.totals.raw, 3);
  assert.equal(a.totals.verified, 1);
  assert.equal(a.referrers[0].name, "news.ycombinator.com");
  assert.ok(isBot(null));
  assert.ok(getRank(row.id, { scope: "category", country: "NZ", category: "bakeries" }));
});

test("stripe webhook signature", () => {
  const secret = "whsec_test", body = '{"id":"evt_1"}', t = 1_800_000_000;
  const sig = crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  assert.ok(verifyStripeSignature(body, `t=${t},v1=${sig}`, secret, t + 10));
  assert.ok(!verifyStripeSignature(body + " ", `t=${t},v1=${sig}`, secret, t + 10), "tampered body");
  assert.ok(!verifyStripeSignature(body, `t=${t},v1=${sig}`, "other", t + 10), "wrong secret");
  assert.ok(!verifyStripeSignature(body, `t=${t},v1=${sig}`, secret, t + 3600), "too old");
  assert.ok(!verifyStripeSignature(body, null, secret, t) && !verifyStripeSignature(body, `t=${t},v1=${sig}`, undefined, t));
});

test("blog posts: raw HTML dropped, unsafe links neutralised, reading time computed", () => {
  const p = parsePost("t", "---\ntitle: T\ndate: 2026-01-01\nkeywords: a, b, c\n---\nHello <script>alert(1)</script> [bad](javascript:alert(1)) [ok](/countries)\n\n## H\n" + "word ".repeat(450));
  assert.ok(!p.html.includes("<script"), "script tag removed");
  assert.ok(!p.html.includes("javascript:"), "javascript: link neutralised");
  assert.ok(p.html.includes('href="/countries"'));
  assert.deepEqual(p.keywords, ["a", "b", "c"]);
  assert.equal(p.minutes, 2);
});

test("admin sign-in: only the three approved Google accounts, tamper-proof cookie", () => {
  assert.ok(isAllowed("19101989karan@gmail.com"));
  assert.ok(isAllowed("CodeBluePulse@gmail.com"));
  assert.ok(isAllowed("nzaucklandkaran@gmail.com"));
  assert.ok(!isAllowed("someone.else@gmail.com"));
  const t = signSession("codebluepulse@gmail.com");
  assert.equal(verifySession(t), "codebluepulse@gmail.com");
  assert.equal(verifySession(t.slice(0, -2) + "xx"), null);
  assert.equal(verifySession(undefined), null);
  const forged = Buffer.from(JSON.stringify({ e: "evil@x.com", x: Date.now() + 1e9 })).toString("base64url") + ".abc";
  assert.equal(verifySession(forged), null);
  assert.equal(verifySession(signSession("evil@x.com")), null);
});
