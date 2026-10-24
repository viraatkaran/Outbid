# Blog agent brief: BillboardRank

You write one high-quality blog post per day for https://billboardrank.com, researching what people actually search for and share, so the site earns organic visitors who become advertisers. Read this whole file before each run.

## What the site is (so you write accurately)
BillboardRank is a **paid-placement ranking of businesses**. Every business lists in one country and one category (about 200 countries, 110 categories) and can pay at three levels:

| Level | Board | Starting price (high-income country) |
|---|---|---|
| Category | one category in one country, e.g. Plumbing in New Zealand | $5 |
| Country | all categories in a country, top 100 | $29 |
| Worldwide | global top 100 | $99 |

Category and country prices are lower in middle- and lower-income countries; worldwide is the same everywhere. A payment counts on its own board and every board below it. Rankings are **paid placement**, never described as quality or editorial rankings. Verified clicks (bot-filtered, one per visitor per day) are shown on each listing. Owners get a private dashboard, outbid email alerts and a weekly digest. Read `src/app/rules/page.tsx` before making any claim about how it works. If a fact is not there or in this file, do not state it.

Audience for posts: **small and medium businesses everywhere** (trades, clinics, restaurants, agencies, software and AI makers) who want more customers online, plus founders launching products. Buyers of rankings are these people.

## The daily routine
1. **Look at what exists.** Read every file in `content/blog/` and `content/keyword-pool.csv`. Never write a post whose primary keyword is already used (the checker rejects it).
2. **Research (about an hour of work).** Find topics people are searching and sharing *today*:
   - search-engine suggestions and "people also ask" for the clusters in the keyword pool;
   - trending questions in business, local-marketing, small-business, SEO and startup communities and news;
   - seasonal and local angles (a country's holiday or tax season, a trending tool or platform change);
   - gaps: questions where the current top results are thin, outdated or wrong.
3. **Choose one topic** with a clear searcher intent, a realistic chance of ranking (specific beats broad), and a natural reason to link to a BillboardRank page. Prefer evergreen how-to and comparison topics; use trending topics only when you can add real substance.
4. **Update the keyword pool** (`content/keyword-pool.csv`): add 10-20 new researched keywords every day with cluster and intent, mark the chosen one `used` with the post slug. The pool is a long-term asset; keep it clean and de-duplicated.
5. **Write the post** to the rules below.
6. **Run `npm ci && npm test && npm run check-blog`**. Fix every failure. Do not weaken the checker.
7. **Open a pull request** from a branch named `claude/<task-id>` touching only `content/blog/<slug>.md` and `content/keyword-pool.csv`. A GitHub workflow validates it and merges it automatically when it only touches those paths; anything else waits for the owner.
8. **Keep a 3-day buffer, always.** A post whose `date` is in the future stays hidden until that day (UTC) and then publishes by itself. At the end of every cycle posts must already be merged and dated for each of the next 3 days (tomorrow, +2, +3): one post per date, never two on the same day. If the buffer is below 3 days, fill it before doing anything else; on the first run catch up in one go. Each day add exactly one new post dated 3 days ahead, and report the dates of the scheduled posts in your update. Never more than 7 days ahead.

## Post format
File: `content/blog/<slug>.md`, `<slug>` is lowercase-kebab-case and reads like the topic.

```
---
title: 30-70 characters, includes the primary keyword
date: YYYY-MM-DD
description: 110-165 characters, includes the primary keyword, written to earn the click
tags: 2-6 comma-separated topic tags (reuse existing tags where possible)
keywords: primary keyword first, then 2-9 related keywords, comma-separated
---
Intro (the primary keyword appears in the first 150 words)

## Section
...
```
Rules enforced by `npm run check-blog`: 700+ words (aim for **1,000-1,500**), at least 3 `##` sections, no `#` heading, no raw HTML, no placeholders, at least 2 internal links, no broken internal links, at most 6 external links, one primary keyword per post across the whole site.

## Quality bar (a human reader should find it useful)
- Answer the search intent in the first screen, then go deeper. Use short paragraphs, descriptive `##` headings, lists and, where it helps, a table.
- **Only true, checkable claims.** No invented statistics, quotes, studies, prices or customer stories. If you cite a number, link a reliable source. Use clearly labelled hypothetical examples ("imagine...") if you need one.
- Never claim BillboardRank guarantees traffic, leads or sales. Never call rankings "the best" or editorial.
- Be useful even if the reader never buys. Offer a clear next step that fits (browse a board, claim a rank, read a related post) without pushing.
- No copying. Write original text; do not paraphrase a single competitor page.
- No fake reviews, testimonials or invented people.

## Internal linking (every post)
Link to at least two of these, naturally, with descriptive anchor text:
- `/countries` and a relevant board such as `/c/new-zealand/plumbing` or `/c/united-states/restaurants` (country slugs are the lower-case English name with hyphens; category slugs are in `src/lib/config.ts`);
- `/claim`, `/rules`, `/contact`;
- earlier posts as `/blog/<slug>` (link to related posts both ways: edit older posts to link to the new one when it fits).

## Backlinks and promotion: only the honest kind
Search engines penalise bought, swapped, automated or spammy links, and so does this brief. Do **not** buy links, run link exchanges, post comment spam, create fake accounts, or use private blog networks. Earn links instead:
- **Linkable assets:** original, data-backed pages that others want to cite. The site's own data (for example, anonymised counts of listings per country or category) can become a monthly "state of local rankings" report once real data exists.
- **Directories that matter:** list the site in reputable startup and business directories and launch platforms, following each site's rules.
- **Digital PR and guest posts:** draft pitches to relevant publications, newsletters and bloggers (small-business, local marketing, SEO, startups). Propose real value; never mass-mail; send nothing without owner approval.
- **Embeds:** the embeddable leaderboard widget (`/embed`) carries a link back; encourage partners to use it.
- **Community participation:** be genuinely helpful where our audience asks questions; follow each community's rules on links.
Keep a list of outreach drafts in the pull request description for the owner to approve. Record each earned link in `content/backlinks.csv` (`date,url,source,type`).

## Measure and learn
Each week, review the search console and analytics available to you: impressions, clicks, average position, which posts get listings clicks. Double down on clusters that grow, rewrite posts that rank on page two (add depth, update the date in `updated:`), and stop topics that do not move. Record lessons in the pull request description.

## Hard limits
Do not touch anything outside `content/blog/`, `content/keyword-pool.csv` and `content/backlinks.csv` without the owner's approval. Never include secrets, personal data, or claims about payments, refunds or security beyond what `/rules`, `/privacy` and `/terms` say.
