# Global Surf Rankings

MVP v0.1 of the athlete and ranking product described in the Founding Edition white paper (v9, September 2026). The circuit is asynchronous: an athlete enters one ocean wave a week into a themed event, the wave receives an ordinal place, and event places mint season points.

The interface is in English. Money on the purse page is a labeled demonstration of the published arithmetic. Nothing is charged and nothing is paid.

Founder: Bruno Pesca. The Founding Edition v9 masthead prints Bruno Amaral; this build uses the name given for the product. Domains: gsr.surf and globalsurfrankings.com.

## Stack

Next.js App Router, TypeScript, Tailwind, PostgreSQL, Prisma, Auth.js (credentials). Docker Compose runs the database.

## Run

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Tests, without a database:

```bash
npm test
```

`npm run db:seed` wipes users, entries and the season, then loads the 2027 demo. Every demo password is `wave-2027`.

| Account | Who |
| --- | --- |
| joao.vasques@gsr.surf | Open athlete, 4th on the Best Barrel board, hashtags `ipanema` and `brazil` |
| pedro.lima@gsr.surf | Same board, judging duty deliberately not current — a new entry is refused |
| desk@gsr.surf | Admin desk. The house has no athlete profile and does not compete |

Open http://localhost:3000. Landing, calendar, the Best Barrel board (`/board/best-barrel`), the purse (`/purse`) and a hashtag view (`/t/ipanema`) are public. Sign in to open a profile and submit a wave.

## Production (Vercel)

The production build script is `prisma generate && prisma migrate deploy && next build`. `postinstall` also runs `prisma generate`. Each Vercel deploy applies committed migrations before `next build`. `DATABASE_URL` must already be set in the Vercel Production environment (Neon). It is not stored in this repo.

Seed does not run on deploy. `npm run db:seed` deletes users, entries, and the season, then loads the 2027 demo, so it must be run once against the empty production database and not again after real signups.

From a checkout of this branch, with the Vercel CLI logged in, inject the Production env without writing it to disk:

```bash
npx vercel env run -e production -- npx prisma db seed
```

The same command with the URL only in the shell, copied from Vercel or Neon and never committed:

```bash
DATABASE_URL='postgresql://…' npx prisma db seed
```

Demo passwords stay `wave-2027`, as in `prisma/seed.ts`.

## What the seed contains

Season vintage 2027, ranking window 1 Oct 2026 → 30 Sep 2027, age taken on 30 Sep 2027. All twelve Open events, with the category cuts from the paper: Junior has the same twelve, 40+ has eleven (no Best Small Wave), 50+ has ten (also no Best Air). Best Surf Pool is one event — Air for Open and Junior, Wave for 40+ and 50+. Best Air's 30 Nov date is marked proposed.

One filled board: Best Barrel, Open, Men, places 1–8. A few other entries sit unplaced, including one pool entry with a recorded US$ 20 toll that is not collected.

## Rules encoded here

Constitutional constants live in `lib/constitution.ts`.

- Ocean entry is free. One ocean wave per ISO week, no banking. Pool submissions are not part of that quota.
- Pool toll is US$ 20, retained by the platform. The app stores the toll in cents and does not charge it.
- A theme ticket is US$ 400,000. 84% (US$ 336,000) is the affixed purse: US$ 250,000 season tables, US$ 50,000 weekly race, US$ 36,000 world champions' fund. 16% (US$ 64,000) is the platform. Those rails sum to the ticket at any whole-cent amount.
- Season-table field shares, founding scenario: Open M 40%, 40+ M 15%, 50+ M 12%, Open W 10%, Junior M 10%, Junior W 5%, 50+ W 5%, 40+ W 3%.
- Paid places are the top 20% of an edition (`floor(0.2 × S)`, at least the winner). Six paid places receive exactly 35 / 20 / 14 / 12 / 10 / 9. Fewer places renormalise that podium. Further places share a tail of weight 4, then the vector is normalised so it still sums to 100%. The purse page shows this exact curve. The white paper prints a few of those dollars rounded (and prints US$ 650 where the 40+ women's sixth place is US$ 675). The printed champion campaign in Annex B.2 is shown beside the law, labeled as printed.
- Event points: podium 100 / 60 / 45 / 35 / 28 / 22 percent of the event base, then 12% through the rest of the top fifth (`floor(S/5)`), then 4% to every other entrant. The winner's base is `100 × √(S/100)`. A field of 400 pays twice a field of 100. The world ranking is the sum of those event points. Points stay provisional until a finale because S is the current entry count.
- Ordinal placement is binary insertion (index 0 is best). The final verdict of the real tribunal is the median of five colleges; the Ranked college abstains below three ballots; an even median resolves toward the Chamber of Champions. The desk in this MVP publishes the place directly. Colleges are not seated.
- An entry is refused when judging duty is not current. Duty is a boolean the desk can flip. There is no drawn queue yet.
- Derived leaderboards filter a world board by hashtag and renumber. They do not judge or pay.
- Verification is Verified or Verified Pro. Pro is a checkbox with no credential check. Tiers gate nothing at the door. Age bands are exclusive.

The calendar follows Section 3 (1 Oct → 30 Sep), not the March 2027 operational opening in the roadmap. Themes close on their finale date. Entries are not yet rejected for being ridden outside the vintage, so the scaffold can be used before opening day.

## Routes

- `/` circuit thesis
- `/calendar` twelve themes
- `/board/best-barrel` demo world board; other theme slugs work the same way
- `/ranking` eight world rankings
- `/purse` public purse, marked DEMO
- `/t/ipanema` derived hashtag board
- `/sign-up`, `/sign-in`, `/profile`, `/enter`, `/my-waves`
- `/athlete/[slug]` public placements
- `/admin/judge` ordinal insertion and the duty flag

## Tests

`npm test` covers the ticket split, purse rails, founding-book totals, points curve, payout shares at every depth through 200 places, binary insertion, college median, hashtag renumbering, category bands, the twelve-event catalogue, the weekly ocean quota and the judging-duty gate.

## Not in v0.1

Real escrow, Pix, cards, KYC, video upload or transcoding, the five live colleges, ballot draw, Monday payroll, the media house, sponsor checkout, Chamber or patron tools, WhatsApp, crypto, and any balance the application increments. The purse display is a mirror of the published founding scenario, not of a processor statement.
