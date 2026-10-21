# Strategy plan: beating outbid.lol and TopFloor.Company

Sources: the two screenshots (21 Oct 2026), plus the ChatGPT plan you pasted. Numbers below are read off the screenshots and are not independently verified.

## 1. What the screenshots actually show

### outbid.lol
- Mechanic: paste URL or handle, pick a category, pay. Position equals total money spent. The "Claim #1 for $17006" button is the whole product.
- Boards: All-time, Today, and Daily archives. Categories: Marketing, SEO, Productivity, Agents, Developer, Crypto, Games, Other.
- Social proof: "14 online, 1,078 visitors today", and a public click count on each listing (67,534 / 17,241 / 24,312).
- The money is on the lifetime and monthly board: $17,001 / $16,000 / $14,028. The Today board is tiny: $20 / $15 / $10 / $10.
- Listing is minimal: logo, title, one-line blurb, category, domain, clicks.

### TopFloor.Company
- Mechanic: claim the top floor of a 3D tower for about $100. Each new claim pays the difference to retake the top.
- Stats wall: 74 floors claimed, $1,207 total sales, 336,864 floors viewed, 24,943 visitors, 127 countries, 109 "aerial hours" (plane banner) booked.
- The real product is the founder's audience: "get a call-out on Sankalp's socials, 64k followers, 2M impressions per month". It is "backed by NextDoor.Company".
- Rooftop and plane-banner slots are separate upsells.
- Total revenue is small: $1,207 across 74 floors.

### What this tells us
1. **Both products sell the owner's audience, not the mechanic.** The leaderboard is the packaging. People pay because traffic and attention show up.
2. **The mechanic is trivially copyable.** The ChatGPT notes cite 500+ outbid clones. Building the same thing with more features does not create a moat.
3. **Revenue is concentrated and small.** TopFloor has made about $1.2k in total. Outbid's big numbers are lifetime totals, probably from a few buyers. This is a thin market today, and nobody has demonstrated that paid ranking produces ROI for buyers.
4. **Neither shows buyers any proof of results.** Outbid shows raw click counts. TopFloor shows vanity totals. This is the gap we can exploit.

## 2. Reality check on "monopoly" and "global dominator"

- A monopoly is not achievable by shipping features. It comes from audience, brand and network effects, and clones can't copy those quickly.
- The ChatGPT plan has about 50 features across 8 phases, which would take months. Competitors are one-page products. We should not out-build them. We should out-trust and out-distribute them.
- The pasted plan includes invented figures (for example "531 boards on 19 October 2026", "100-300 businesses in 90 days"). Treat these as hypotheses.
- If we position ourselves as an "ad marketplace with analytics", we compete with Google and Meta. If we position ourselves as a "ranking game plus proof of results", we compete with small clones. The second is winnable.

## 3. Where we can beat them

| Gap | Outbid | TopFloor | Our answer |
|---|---|---|---|
| Proof of results | Raw click count | Vanity stats | Verified, bot-filtered clicks per listing, with a private buyer dashboard (referrers, countries, daily trend) |
| Audience | Own traffic only | Founder socials | Launch with an owned audience: newsletter, X/LinkedIn, partner communities |
| Niche relevance | Broad categories | One tower | Vertical boards (AI tools, SaaS, local business by country/city) so small players can win a board |
| Fairness | Whales win forever | Whales win forever | Time-boxed seasons (weekly/monthly reset with an all-time hall of fame), plus "rank per dollar" and "fastest climber" boards |
| Stickiness | One-off payment | One-off payment | Reasons to return: season resets, rival alerts ("you were outbid"), streaks |
| Spectacle | Flat list | 3D tower, heavy | Lightweight 2D/2.5D "skyline" that loads fast, plus shareable winner cards |
| Global reach | English only | English only | i18n and regional boards from day one, local currencies, local payment methods |
| Trust | Rules page | Unclear | Clear "paid placement" label, public rank history, refund policy, abuse reporting |

## 4. Features, prioritised

Do not build all of this. Ship P0, then add P1 only when users ask for it.

### P0: launch (the clone, but better)
1. Landing page with one big claim CTA: URL, category, amount, pay.
2. Boards: All-time, Today, Season (weekly/monthly), per category.
3. Stripe Checkout with signed webhooks, idempotent bid processing, and atomic rank updates.
4. Listing pages: logo (auto-fetched), title and description (auto-fetched from the URL), category, domain.
5. Verified click tracking with a redirect endpoint, basic bot filtering and de-duplication. Show verified clicks publicly.
6. Rules, refund policy, and clear "paid placement" labelling.
7. Share card generation (Open Graph image) for "Ranked #N in X".
8. Dark mode and mobile-first layout.

### P1: the differentiators
9. Buyer dashboard: clicks over time, top countries, referrers, cost per click.
10. "Outbid" email and webhook alerts, so rivals can fight back.
11. Seasonal reset plus a hall of fame and trophies.
12. Regional and city boards.
13. Claimable profiles with domain verification (DNS TXT or meta tag).
14. Embeddable live leaderboard widget (backlinks and distribution).
15. AI helpers: auto-categorise, write a listing blurb from the URL, flag duplicates and spam. Keep these as assists, not as source of metrics.
16. Public challenges: "Company A vs Company B this week".

### P2: only after repeat demand
17. 2.5D/3D skyline (React Three Fiber) with a 2D fallback.
18. Agency multi-client dashboard, team roles, white-label reports.
19. Conversion pixels and UTM builder, ROI reports.
20. Public API and webhooks.
21. Sponsored category ownership (time-limited exclusive slots).
22. Referral programme with disclosed credits.

### Rough count
About 8 P0, 8 P1 and 6 P2 features, so about 22 meaningful features. That is already more than either competitor. The ChatGPT list of 50 is mostly P2 noise.

## 5. Distribution is the moat

1. **Pre-seed the board.** Launch with real listings (friends, indie founders, your own projects) so the page is not empty.
2. **Own an audience early.** Both competitors win because of a founder audience. Start building a newsletter, X and LinkedIn presence now, before launch.
3. **Build in public.** Share revenue, rank wars and winner stories. Rank battles make good content.
4. **Shareable wins.** Every payment produces a card the buyer wants to post.
5. **Widgets and directories.** Embeds create backlinks. Programmatic SEO pages per category, country and season.
6. **Partnerships.** Newsletters, Product Hunt-style communities, agencies.

## 6. Monetisation

- Paid ranking bids (core).
- Time-boxed featured and sponsored slots.
- Pro analytics subscription (about US$19-49/month, to test).
- Agency plan (about US$99-299/month, to test).
- Category sponsorships, API and widget tiers (later).

All price points are guesses to be validated with real buyers.

## 7. Technical plan

- **Stack:** Next.js (App Router) + TypeScript, Postgres (Supabase), Stripe, Vercel, Redis for rate limits, Sentry.
- **Ranking integrity:** a ledger of immutable bids, rank derived from the ledger, and a single transactional path for "place bid". All Stripe webhooks are idempotent.
- **Click tracking:** server-side redirect with a signed token, IP and user-agent heuristics, rate limits, and a separate "verified" versus "raw" count.
- **Security:** no secrets in the client, row-level security, an admin review queue, abuse reporting, and URL safety checks (block malware and adult content, and SSRF-safe metadata fetching).
- **Legal:** disclose paid placement, trademark and brand-name check, terms, privacy policy, refund policy.

## 8. Roadmap

| Phase | Scope | Rough time |
|---|---|---|
| 0 | Name, domain, brand and trademark check; repo, CI, staging | 2-3 days |
| 1 | Core boards, listing flow, fake data, UI | ~1 week |
| 2 | Stripe, ledger, rank engine, tests | ~1 week |
| 3 | Click tracking, verified counts, public stats | ~1 week |
| 4 | Dashboards, alerts, share cards | ~1-2 weeks |
| 5 | Private beta with 20-50 founders, collect ROI proof | 2 weeks |
| 6 | Public launch, then seasons, regional boards, widgets | ongoing |
| 7 | 3D skyline, agency tools, API, only if demand exists | later |

These are estimates for one developer working with AI assistance.

## 9. Success metrics (first 90 days, hypotheses)

- Paying customers, and visitor-to-paid conversion.
- Repeat bids per customer (the key stickiness metric).
- Verified clicks delivered per dollar spent. This is our proof of value.
- Share of buyers who post their rank publicly (viral loop).
- Refunds, chargebacks and fraud rate.

## 10. Main risks

- **Cold start:** no traffic means no buyers, and no buyers means no traffic. Solve with an owned audience and seeded listings.
- **Clones:** differentiate on trust, analytics and community, not on UI.
- **Fake clicks and bid manipulation:** invest in fraud controls early.
- **Overbuilding:** do not build 3D, agency tools or the API before real users pay.
- **Legal and payments:** advertising disclosure, privacy, and payment-processor restrictions.

## 11. Open decisions for you

1. Brand name and domain (check trademarks and handles first).
2. Positioning: generic "world ranking" or a niche to start (for example AI tools or SaaS)?
3. Do you have, or can you build, an audience before launch?
4. Seller entity and payment provider (depends on your country).
5. Do you want me to scaffold the Next.js + Stripe + Postgres project (P0) next?
