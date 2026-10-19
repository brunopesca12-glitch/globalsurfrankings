# Global Surf Rankings

MVP v0.1 of the athlete and ranking product described in the Founding Edition white paper (v10.1, 6 October 2026). The circuit is asynchronous: an athlete enters one ocean wave a week into a themed event, the wave receives an ordinal place, and event places mint season points. The public competition rules are `/rules`. The white paper PDF is not published.

The interface is in English. The site publishes payment orders from the rules. Nothing is charged, nothing is held, and nothing is paid through the platform.

Domains: gsr.surf and globalsurfrankings.com. The public site does not print a personal founder credit.

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
| pedro.lima@gsr.surf | Same board. A new entry is refused until this week's judging queue is sealed |
| desk@gsr.surf | Admin desk. The house has no athlete profile and does not compete |

Open http://localhost:3000. Landing, the video gallery (`/videos`), the calendar, the Best Barrel world board (`/board/best-barrel`), the purse (`/purse`) and hashboards (`/hashboards`) are public. Sign in to open a profile and submit a wave.

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

Judge accounts are a separate insert-only script. It never deletes and never updates an existing user. Run it only when you want those five logins in a database that already has Season 2027:

```bash
npm run db:demo-judges
```

| Email | College |
| --- | --- |
| chamber@gsr.surf | Chamber of Champions, seated by the script |
| ranked@gsr.surf | The Ranked, seated by the script |
| athletes@gsr.surf | Athletes' College, from an unplaced entry |
| upper@gsr.surf | Upper Chamber, placed on an empty edition |
| public@gsr.surf | The Public |

A second insert-only script adds the judge-experience accounts. It never deletes.

```bash
npm run db:demo-experience
```

| Email | College |
| --- | --- |
| legend@gsr.surf | Chamber of Champions, by override and seat |
| gallery@gsr.surf | The Public, a verified athlete with no entry |
| chamber.guest@gsr.surf | Chamber of Champions on production, created from a desk invite. The password is `wave-2027`. Joao Vasques (joao.vasques@gsr.surf, same password) sits in the Upper Chamber. |

The password for every demo account, including joao.vasques@gsr.surf and desk@gsr.surf, is `wave-2027`. It is not printed on the sign-in page. On production, a Chamber judge can also be created from the desk with an invite link, without running a script.

Set `SITE_GATE_USER` and `SITE_GATE_PASSWORD` on Vercel to require HTTP Basic Auth before any page (the user defaults to `gsr`). Remove `SITE_GATE_PASSWORD` to disable the gate. The password is not stored in this repo. Athlete sign-in still happens after the gate.

## What the seed contains

Season vintage 2027, Season 1, 1 Mar 2027 → 30 Sep 2027. Six events: Frontside, Backside, Best Aerial, Best Small-Wave Performance, Best Tube, Biggest Paddle-In Wave. The other former themes are listed as coming later. Best Small-Wave Performance is Open and Junior only. Best Aerial is not on the 50+ ranking.

One filled board: Best Barrel, Open, Men, places 1–8. A few other entries sit unplaced, including one pool entry with a recorded US$ 20 toll that is not collected.

## Rules encoded here

Constitutional constants live in `lib/constitution.ts`.

- Ocean entry is free. One ocean wave per ISO week, no banking. Pool submissions are not part of that quota.
- Pool toll is US$ 20 and passes whole to the judges. The app stores the toll in cents and does not collect it.
- A theme ticket is US$ 400,000. 84% (US$ 336,000) goes to surfers: 78% prize money (US$ 312,000 — season tables US$ 232,000, weekly race US$ 46,500, world champions' fund US$ 33,500) and 6% judges (US$ 24,000, US$ 12,000 to each of the Chamber and the Ranked). 16% (US$ 64,000) is the platform. Those rails sum to the ticket at any whole-cent amount. The site mirrors the escrow and does not move the money.
- Season-table field shares, founding scenario: Open M 40%, 40+ M 15%, 50+ M 12%, Open W 10%, Junior M 10%, Junior W 5%, 50+ W 5%, 40+ W 3%.
- Paid places are the top 20% of an edition (`floor(0.2 × S)`, at least the winner). On a large field the podium six take 80% of the table on the curve 35 / 20 / 14 / 12 / 10 / 9, which is 28 / 16 / 11.2 / 9.6 / 8 / 7.2% of the table. Places 7 through the cutoff split the other 20% equally, and none is paid more than sixth; a short tail returns the excess to the podium. Six or fewer paid places receive the whole table on that curve. The purse page shows this law. The white paper rounds a few of those cents to the dollar. The printed champion campaign in Annex B.2 is shown beside the law, labeled as printed.
- Event points: podium 100 / 60 / 45 / 35 / 28 / 22 percent of the event base, then 12% through the rest of the top fifth (`floor(S/5)`), then 4% to every other entrant. The winner's base is `100 × √(S/100)`. A field of 400 pays twice a field of 100. The world ranking is the sum of those event points. Points stay provisional until a finale because S is the current entry count.
- Ordinal placement is binary insertion (index 0 is best). A judge's ballot is sealed. Each college's public place is the median of its ballots, and the college abstains below three. The wave's place is the median of the colleges that voted; an even split resolves toward the Chamber of Champions. The desk runs that Monday verdict. It does not type a place.
- One person sits in one college: a desk override, then Chamber, then Ranked, then the Upper Chamber (top 10 of a category ranking), then Athletes (anyone who entered that season), then the Public. A verified athlete with no higher claim is the Public. The desk, and an account with no athlete profile, do not judge unless invited. The rules live in `lib/eligibility.ts`. A judge never draws a wave in their own category or a declared clubmate's, and the ballot does not show the athlete.
- An entry is refused while this ISO week's ballot queue is still open. Monday holds a wave when the week it was entered still has open ballots, so the new week does not pull last week's wave back out. The queue is at most 8 ballots (the paper's "about fifteen minutes"). The old duty checkbox is unused. Waves judged in the same week are compared with the board already published, not with each other.
- The Ranked college is capped at US$ 6 a ballot. On the founding scenario the paper prints about US$ 3.30 for The Ranked and about US$ 4.80 for the Chamber. Nothing is paid. A judge sees their own mean deviation after Monday. Public accuracy boards, demotion, and the Golden Eye are not in this version. Upper Chamber membership is the top 10, not the paper's accuracy-promotion ladder.
- Hashboards filter a world board by hashtag and renumber. They do not judge or pay.
- Verification is Verified or Verified Pro. Pro is a checkbox with no credential check. Tiers gate nothing at the door. Age bands are exclusive.

The calendar follows Section 3 of v10.1: the Founding Season is 1 Mar → 30 Sep 2027, and Season 2028 returns to 1 Oct → 30 Sep. Themes close on their finale date. Entries are not yet rejected for being ridden outside the vintage, so the scaffold can be used before opening day.

## Routes

- `/` world rankings and the purse on each theme
- `/about` the circuit thesis
- `/rules` the public competition rules. The PDF is not served.
- `/videos` watch every uploaded wave; `/videos/[id]` plays one
- `/calendar` the six Season 1 events
- `/board/best-tube` demo world board; other event slugs work the same way
- `/escrow` published payment orders, and an empty list of on-chain executions until a contract address exists. `/api/payment-orders` is the machine-readable file.
- `/ranking` eight world rankings
- `/purse` public purse, marked DEMO
- `/hashboards` an athlete's hashtag rankings; `/hashboards/[tag]` is one tag. `/t/[tag]` redirects there
- `/sign-up`, `/sign-in`, `/profile`, `/enter`, `/my-waves`
- `/athlete/[slug]` public placements
- `/judge` where you are judging. `/judge/ballot` place the new wave into your own list. `/judge/history` your places
- `/invite/[token]` personal invite into a college
- `/admin/judge` seat the Chamber and the Ranked, override a college, mint an invite, and run Monday's verdict

## Tests

`npm test` covers the ticket split, purse rails, founding-book totals, points curve, payout shares at every depth through 200 places, payment-order hashes, binary insertion, college median, hashtag renumbering, category bands, the six-event catalogue, the weekly ocean quota and the judging-duty gate.

## Not in v0.1

On-chain payout execution, Pix, cards, KYC, video upload or transcoding, a ride-date field, an image-rights attestation on the entry form, public accuracy boards, the Golden Eye, accuracy promotion into the Upper Chamber, the media house, sponsor checkout, patron tools, WhatsApp, and any balance the application increments. The site publishes payment orders. An outside bot pays them. The Ranked cap of US$ 6 is applied when those orders are built. No money moves through the platform. `/rules` states the published competition rules, including the fields the entry form does not collect yet.
