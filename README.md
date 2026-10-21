# Rank marketplace (working title: ToolTower)

A paid-placement leaderboard for AI tools and SaaS with verified click analytics, a blog and a newsletter. See `PLAN.md` for strategy.

## Run it
```
cp .env.example .env.local
npm install
npm run seed     # optional demo listings (fake data)
npm run dev      # http://localhost:3000
npm test         # unit tests
npm run build && npm start
```
Set `NEXT_PUBLIC_BRAND_NAME` and `NEXT_PUBLIC_SITE_URL` once the name/domain is chosen.

## What's built
- Leaderboards: all-time, month, week, today, per category. Ties go to whoever reached the total first.
- Claim flow: URL or @handle, category, amount, optional email, then checkout. Site title/description are fetched with an SSRF guard.
- Payments: **test mode only** (`PAYMENT_PROVIDER=mock`). Orders are fulfilled idempotently in a transaction. A signed webhook endpoint exists (`/api/webhooks/payments`). The mock checkout is blocked in production unless `ALLOW_MOCK_PAYMENTS=1`.
- Click tracking via `/go/[slug]`: every click is stored, only the first non-bot click per visitor per day is "verified".
- Owner dashboard at the private `/manage/[token]` link: clicks (14 days), referrers, countries, cost per verified click, payment history.
- Public listing pages with share card images (`/api/og/[slug]`), embeddable widget (`/embed`), JSON API (`/api/v1/leaderboard`).
- Blog (Markdown in `content/blog`), RSS, sitemap, robots, newsletter signup, report button, admin page (`/admin?key=ADMIN_KEY`), dark mode.

## Before real launch (not done yet)
1. **Real payments:** implement a provider in `src/lib/payments.ts` (Paddle / Lemon Squeezy / Stripe) and call `fulfillOrder` from its verified webhook. Adapt the webhook to the provider's signature format.
2. **Database:** SQLite is a single file on one server. For Vercel/serverless, move to Postgres (e.g. Supabase); `src/lib/db.ts` and the SQL in `rank.ts`, `listings.ts` and `track.ts` need porting.
3. **Email:** send owner links, outbid alerts and the newsletter through an email provider (emails are stored but nothing is sent yet).
4. **Owner access:** the private link is the only credential; add email login or emailing the link.
5. **Abuse controls:** the rate limiter is in-memory; use a shared store. Add URL safety checks and an admin review queue.
6. **Legal:** have `/rules` (terms, refunds, disclosure) reviewed; add a privacy policy.
7. Remove demo data and change `HASH_SECRET`.

## Not built yet (roadmap)
3D/2.5D skyline, challenges between rivals, hall of fame/trophies, regional boards, domain verification, agency accounts, conversion pixels, i18n.
