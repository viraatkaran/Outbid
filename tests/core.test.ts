process.env.DATABASE_PATH = ":memory:";
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUrl } from "../src/lib/url";
import { isPrivateIp } from "../src/lib/metadata";
import { isBot, recordClick, listingAnalytics } from "../src/lib/track";
import { ValidationError, createOrder, fulfillOrder } from "../src/lib/listings";
import { getBoard, getRank, periodStart } from "../src/lib/rank";

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

async function pay(url: string, cents: number, cat = "ai-agents") {
  const { orderId } = await createOrder({ urlInput: url, category: cat, amountCents: cents });
  return fulfillOrder(orderId, "ref_" + orderId);
}

test("ranking, ties, idempotency and raising a bid", async () => {
  const a = await pay("a-offline.invalid", 1000);
  const b = await pay("b-offline.invalid", 1000);
  let board = getBoard({ period: "all" });
  assert.equal(board[0].domain, "a-offline.invalid", "tie goes to earlier");
  await pay("b-offline.invalid", 100); // same URL raises
  board = getBoard({ period: "all" });
  assert.equal(board[0].domain, "b-offline.invalid");
  assert.equal(board.length, 2);
  // fulfilling the same order twice must not add a second bid
  const { orderId } = await createOrder({ urlInput: "c-offline.invalid", category: "dev-tools", amountCents: 700 });
  fulfillOrder(orderId, "dup"); fulfillOrder(orderId, "dup");
  assert.equal(getBoard({ period: "all" }).find((r) => r.domain === "c-offline.invalid")?.total_cents, 700);
  assert.equal(getRank(a.slug ? 1 : 0, "all")?.total, 3);
  void b;
});

test("validation", async () => {
  await assert.rejects(createOrder({ urlInput: "z-offline.invalid", category: "ai-agents", amountCents: 100 }), ValidationError);
  await assert.rejects(createOrder({ urlInput: "z-offline.invalid", category: "nope", amountCents: 1000 }), ValidationError);
});

test("click verification dedupes and filters bots", async () => {
  const l = await pay("clicks-offline.invalid", 500);
  const row = getBoard({ period: "all" }).find((r) => r.domain === "clicks-offline.invalid")!;
  const c = { listingId: row.id, ip: "1.2.3.4", referrer: "https://news.ycombinator.com/x", country: "us" };
  recordClick({ ...c, ua: "Mozilla/5.0" });
  recordClick({ ...c, ua: "Mozilla/5.0" });
  recordClick({ ...c, ua: "Googlebot/2.1" });
  const a = listingAnalytics(row.id);
  assert.equal(a.totals.raw, 3);
  assert.equal(a.totals.verified, 1);
  assert.equal(a.referrers[0].name, "news.ycombinator.com");
  assert.ok(isBot(null));
  void l;
});
