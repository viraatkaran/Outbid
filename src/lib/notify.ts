import { db } from "./db";
import { BRAND, SITE_URL, categoryLabel, fmtUsd } from "./config";
import { countryName } from "./countries";
import { esc, layout, sendEmail } from "./email";
import { fulfillOrder, getOrder, type Fulfilled, type Listing, type Order } from "./listings";
import { boardKey, getBoardOrder, listingRanks, type Board } from "./rank";
import type { Scope } from "./pricing";
import { SCOPE_LABEL } from "./pricing";

const MAX_OUTBID_EMAILS_PER_BOARD = 25;

/** Boards whose order can change when a payment is made at this level. */
export function affectedBoards(o: { scope: Scope; country: string; category: string }): Board[] {
  const boards: Board[] = [{ scope: "category", country: o.country, category: o.category }];
  if (o.scope === "country" || o.scope === "world") boards.push({ scope: "country", country: o.country });
  if (o.scope === "world") boards.push({ scope: "world" });
  return boards;
}

export function boardLabel(b: Board): string {
  if (b.scope === "world") return "Worldwide";
  if (b.scope === "country") return `All categories in ${countryName(b.country ?? "")}`;
  return `${categoryLabel(b.category ?? "")} in ${countryName(b.country ?? "")}`;
}

export function boardUrl(b: Board): string {
  return b.scope === "world" ? SITE_URL : `${SITE_URL}/claim`;
}

/** Marks an order paid, then sends the receipt, outbid alerts and the owner notice. Never throws because of email. */
export async function completeOrder(orderId: string, paymentRef: string): Promise<Fulfilled> {
  const order = getOrder(orderId);
  const alreadyPaid = order?.status === "paid";
  const before = order && !alreadyPaid ? affectedBoards(order).map((b) => ({ b, ids: getBoardOrder(b) })) : [];
  const result = fulfillOrder(orderId, paymentRef);
  if (order && !alreadyPaid) {
    void afterPurchase(order, result, before).catch((e) => console.error("[notify]", e));
  }
  return result;
}

async function afterPurchase(order: Order, result: Fulfilled, before: { b: Board; ids: { id: number; total: number }[] }[]) {
  const listing = db().prepare("SELECT * FROM listings WHERE id = ?").get(result.listingId) as Listing;
  await Promise.allSettled([sendReceipt(order, listing, result), notifyOwner(order, listing), sendOutbidAlerts(order, listing, before)]);
}

async function sendReceipt(order: Order, listing: Listing, result: Fulfilled) {
  // The private dashboard link only goes to the address saved when the listing was created.
  if (!listing.email || (!result.created && order.email !== listing.email)) return;
  const ranks = listingRanks(listing);
  const rankLine = (label: string, r: { rank: number } | null) => (r ? `<li>${label}: <b>#${r.rank}</b></li>` : "");
  const link = `${SITE_URL}/manage/${listing.owner_token}`;
  await sendEmail(
    listing.email,
    result.created ? `You're live on ${BRAND}: ${listing.title}` : `Payment received for ${listing.title}`,
    layout({
      heading: result.created ? "You're on the board" : "Payment received",
      bodyHtml: `<p>${esc(listing.title)} (${esc(listing.domain)}) paid <b>${fmtUsd(order.amount_cents)}</b> at the <b>${SCOPE_LABEL[order.scope]}</b> level.</p>
<ul>${rankLine("Category rank", ranks.category)}${rankLine("Country rank", ranks.country)}${rankLine("Worldwide rank", ranks.world)}</ul>
<p>Your private dashboard shows verified clicks, referrers and countries. Keep this link safe: anyone who has it can manage the listing.</p>`,
      cta: { url: link, label: "Open my dashboard" },
    }),
  );
}

async function notifyOwner(order: Order, listing: Listing) {
  const admin = process.env.ADMIN_EMAIL;
  if (!admin) return;
  await sendEmail(
    admin,
    `New payment: ${fmtUsd(order.amount_cents)} for ${listing.domain}`,
    layout({
      heading: "New payment",
      bodyHtml: `<p>${esc(listing.title)} (${esc(listing.domain)}) paid ${fmtUsd(order.amount_cents)} at the ${SCOPE_LABEL[order.scope]} level.<br>${esc(boardLabel({ scope: "category", country: listing.country, category: listing.category }))}</p>`,
    }),
  );
}

/**
 * A listing is "outbid" on a board when the payer was below it before and is above it now.
 * Each listing gets at most one alert per board per day.
 */
async function sendOutbidAlerts(order: Order, bidder: Listing, before: { b: Board; ids: { id: number; total: number }[] }[]) {
  const d = db();
  const day = new Date().toISOString().slice(0, 10);
  for (const { b, ids } of before) {
    const after = getBoardOrder(b);
    const bidderBefore = ids.findIndex((r) => r.id === bidder.id);
    const bidderAfter = after.findIndex((r) => r.id === bidder.id);
    if (bidderAfter < 0) continue;
    const passed = after
      .slice(bidderAfter + 1)
      .map((r, i) => ({ ...r, pos: bidderAfter + 1 + i + 1, was: ids.findIndex((x) => x.id === r.id) }))
      .filter((r) => r.was >= 0 && (bidderBefore < 0 || r.was < bidderBefore))
      .slice(0, MAX_OUTBID_EMAILS_PER_BOARD);
    for (const p of passed) {
      const victim = d.prepare("SELECT * FROM listings WHERE id = ?").get(p.id) as Listing | undefined;
      if (!victim?.email || !victim.alerts) continue;
      const key = boardKey(b);
      const fresh = d.prepare("INSERT OR IGNORE INTO alerts_sent (listing_id, board_key, day) VALUES (?,?,?)").run(victim.id, key, day).changes > 0;
      if (!fresh) continue;
      const gap = after[bidderAfter].total - p.total + 100;
      await sendEmail(
        victim.email,
        `You were outbid on ${boardLabel(b)}`,
        layout({
          heading: "You've been outbid",
          bodyHtml: `<p>Another business just passed <b>${esc(victim.title)}</b> on <b>${esc(boardLabel(b))}</b>. You are now <b>#${p.pos}</b>.</p>
<p>To take the lead back you need about <b>${fmtUsd(gap)}</b> more at the ${SCOPE_LABEL[b.scope]} level.</p>`,
          cta: { url: `${SITE_URL}/manage/${victim.owner_token}`, label: "Retake my rank" },
          footerHtml: `You get these because you listed on ${esc(BRAND)}. You can switch alerts off in your dashboard.`,
        }),
      );
    }
  }
}

export async function sendDashboardLinks(email: string) {
  const rows = db().prepare("SELECT * FROM listings WHERE email = ? AND status = 'active'").all(email) as Listing[];
  if (!rows.length) return;
  const items = rows.map((l) => `<li><a href="${SITE_URL}/manage/${l.owner_token}">${esc(l.title)}</a> (${esc(l.domain)})</li>`).join("");
  await sendEmail(
    email,
    `Your ${BRAND} dashboard link${rows.length > 1 ? "s" : ""}`,
    layout({ heading: "Your dashboards", bodyHtml: `<p>You asked for your dashboard link${rows.length > 1 ? "s" : ""}:</p><ul>${items}</ul><p>If you didn't ask, ignore this email.</p>` }),
  );
}

export async function sendDigest(): Promise<{ recipients: number; sent: number }> {
  const { getBoard } = await import("./rank");
  const { getPosts } = await import("./blog");
  const top = getBoard({ scope: "world", period: "week", limit: 10 });
  const rows = top.length ? top : getBoard({ scope: "world", period: "all", limit: 10 });
  const list = rows.map((r, i) => `<li>#${i + 1} <a href="${SITE_URL}/l/${r.slug}">${esc(r.title)}</a>: ${fmtUsd(r.total_cents)}</li>`).join("");
  const posts = getPosts().slice(0, 3).map((p) => `<li><a href="${SITE_URL}/blog/${p.slug}">${esc(p.title)}</a></li>`).join("");
  const subs = db().prepare("SELECT email, token FROM subscribers").all() as { email: string; token: string }[];
  let sent = 0;
  for (const s of subs) {
    const ok = await sendEmail(
      s.email,
      `This week's worldwide top 10 on ${BRAND}`,
      layout({
        heading: "This week's worldwide top 10",
        bodyHtml: `<ol style="padding-left:18px">${list.replace(/<li>#\d+ /g, "<li>")}</ol>${posts ? `<p><b>New on the blog</b></p><ul>${posts}</ul>` : ""}`,
        cta: { url: SITE_URL, label: "See the full rankings" },
        footerHtml: `You subscribed on ${esc(BRAND)}. <a href="${SITE_URL}/unsubscribe?token=${s.token}">Unsubscribe</a>.`,
      }),
    );
    if (ok) sent++;
  }
  return { recipients: subs.length, sent };
}
