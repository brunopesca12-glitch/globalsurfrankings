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

The production build script is `prisma generate && node scripts/migrate-if-safe.mjs && next build`. `postinstall` also runs `prisma generate`. A Production deploy (`VERCEL_ENV=production`) applies committed migrations to `DATABASE_URL` before `next build`. A Preview deploy does not migrate `DATABASE_URL`. It migrates only when `PREVIEW_DATABASE_URL` is set and different from `DATABASE_URL`. `DATABASE_URL` must already be set in the Vercel Production environment (Neon). It is not stored in this repo. The Preview environment needs its own `DATABASE_URL` (a separate Neon branch). Sharing the production URL with Preview lets preview code read and write production even when migrate is skipped.

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

Password reset uses Resend (`RESEND_API_KEY`, from `GSR <no-reply@gsr.surf>`). If the key is missing, the forgot-password page says so and does not crash. Add the domain in Resend and publish the DKIM, SPF, and DMARC records it shows.

Monday’s verdict runs from Vercel Cron at 09:00 America/Sao_Paulo (`0 12 * * 1` UTC) on `/api/cron/monday-verdict`. Set `CRON_SECRET` in the Vercel project. Vercel sends it as `Authorization: Bearer`. If the secret is missing the route returns 401 and does not publish. If `RESEND_API_KEY` is missing the verdict still publishes and the results email is skipped. The desk button remains a manual rerun. The reveal page is `/verdict`.

Preseason 2026–27 is 1 Dec 2026 through 28 Feb 2027. Its points do not count toward the Founding Season, which starts 1 Mar 2027. New entries in that window are filed on the preseason. Entries ask for the original video file only. A capture date outside the season is refused. A file with no capture date is accepted and marked for review. Keyframes are kept for the desk. A judge can report “Seen this wave before”; the desk can ban that account in one click.

The calibration key is at `/admin/calibration`. The desk and accounts marked as pros vote. Two agreeing votes lock a pair. About one card in four of the judge deck is one of those pairs.

Demo cleanup is `npm run db:remove-demo`. It refuses to run without `--dry-run` or `--apply`. Tube/barrel and Big Surf demo rows are kept. Take a backup before `--apply`. Do not point it at a database you have not backed up.

## Submission checks

An entry stores a required attestation that the wave has never been posted on any social network or platform. The file is hashed (SHA-256) and sampled frames get a perceptual hash, so an exact copy or a re-saved, trimmed, or cropped copy of a wave already in GSR is refused. Frames are also sent to a vision model, which checks the clip against the chosen title. A clear miss is refused. An unsure read, a link we cannot open (YouTube, Vimeo), or a missing vision key is accepted and marked pending review at `/my-waves` and `/admin/review`. Signed-in surfers and judges can report that a wave was already published. The desk clears it or removes it there. There is no automatic social-network search.

A direct key is used first: `OPENAI_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`), or `ANTHROPIC_API_KEY`. Optional model names: `OPENAI_VISION_MODEL`, `GEMINI_VISION_MODEL`, `ANTHROPIC_VISION_MODEL`. If none of those keys is set, the title check uses the Vercel AI Gateway (`google/gemini-2.5-flash`, override with `AI_GATEWAY_MODEL`). On Vercel that signs in with `VERCEL_OIDC_TOKEN`. Locally set `AI_GATEWAY_API_KEY`. A gateway error accepts the wave and marks it pending review. Frame sampling uses the `ffmpeg-static` binary. `BLOB_READ_WRITE_TOKEN` lets a phone video upload directly on Vercel. Do not run `db:seed` again on a database that already has real accounts. The validation migration only adds columns and tables.

## What the seed contains

Season vintage 2027, Founding Season, 1 Mar 2027 → 29 Feb 2028, champions crowned March 2028. Seven titles: Best Tube, Best Aerial, Biggest Paddle-In Wave (big wave), Best Small-Wave Performance, Frontside, Backside, Wave Pool. Four divisions per title: Open and Masters 40+, men's and women's (28 weekly champions). Junior and Masters 50+ are retired; the enum values stay in the database so older rows still read.

One filled board: Best Tube (the barrel board), Open, Men, places 1–8. A few other entries sit unplaced. Pool entry is free unless `GSR_POOL_FEE_CENTS` is set.

## Rules encoded here

Constitutional constants live in `lib/constitution.ts`.

- Ocean entry is free. One ocean wave per ISO week, no banking. Pool submissions are not part of that quota.
- Pool toll is off (`GSR_POOL_FEE_CENTS` unset or 0). Set that variable to a positive number of cents to record a toll again. The app stores the toll in cents and does not collect it. Ocean entry stays free.
- The founding sponsorship is US$ 5,000,000, split 78 / 6 / 16: US$ 3,900,000 competitors' prize money, US$ 300,000 judges (half Chamber, half Ranked), US$ 800,000 platform. The prize money splits 53% season tables (US$ 2,067,000), 36% weekly race (US$ 1,404,000, about US$ 27,000 every Monday over 52 weeks) and 11% world champions' fund (US$ 429,000), equally across the seven titles. The site mirrors the escrow and does not move the money.
- Division shares: pro-rata to each division's field; until a field exists the four divisions are weighted equally (25% each).
- Paid places are the top 20% of an edition (`floor(0.2 × S)`, at least the winner). On a large field the podium six take 80% of the table on the curve 35 / 20 / 14 / 12 / 10 / 9, which is 28 / 16 / 11.2 / 9.6 / 8 / 7.2% of the table. Places 7 through the cutoff split the other 20% equally, and none is paid more than sixth; a short tail returns the excess to the podium. Six or fewer paid places receive the whole table on that curve. The purse page shows this law. The white paper rounds a few of those cents to the dollar. The printed champion campaign in Annex B.2 is shown beside the law, labeled as printed.
- Event points: podium 100 / 60 / 45 / 35 / 28 / 22 percent of the event base, then 12% through the rest of the top fifth (`floor(S/5)`), then 4% to every other entrant. The winner's base is `100 × √(S/100)`. A field of 400 pays twice a field of 100. The world ranking is the sum of those event points. Points stay provisional until a finale because S is the current entry count.
- Ordinal placement is binary insertion (index 0 is best). A judge's ballot is sealed. Each college's public place is the median of its ballots, and the college abstains below three. The wave's place is the median of the colleges that voted; an even split resolves toward the Chamber of Champions. The desk runs that Monday verdict. It does not type a place.
- One person sits in one college: a desk override, then Chamber, then Ranked, then the Upper Chamber (top 10 of a category ranking), then Athletes (anyone who entered that season), then the Public. A verified athlete with no higher claim is the Public. The desk, and an account with no athlete profile, do not judge unless invited. The rules live in `lib/eligibility.ts`. A judge never draws a wave in their own category or a declared clubmate's, and the ballot does not show the athlete.
- An entry is refused while this ISO week's ballot queue is still open. Monday holds a wave when the week it was entered still has open ballots, so the new week does not pull last week's wave back out. The queue is at most 8 ballots (the paper's "about fifteen minutes"). The old duty checkbox is unused. Waves judged in the same week are compared with the board already published, not with each other.
- The Ranked college is capped at US$ 6 a ballot. On the founding scenario the paper prints about US$ 3.30 for The Ranked and about US$ 4.80 for the Chamber. Nothing is paid. A judge sees their own mean deviation after Monday, and an eye score built from that deviation plus calibration accuracy. Upper Chamber membership is the top 10, not the paper's accuracy-promotion ladder. The eye score does not mint season points.
- Hashboards filter a world board by hashtag and renumber. They do not judge or pay.
- Verification is Verified or Verified Pro. Pro is a checkbox with no credential check. Tiers gate nothing at the door. Age bands are exclusive.

The calendar follows Section 3 of v10.1: the Founding Season is 1 Mar 2027 → 29 Feb 2028. Themes close on their finale date. A video file whose capture date falls outside the season it is entered in is refused. A file with no capture date is kept and marked for review.

## Routes

- `/` world rankings. A visitor with no account first plays three calibration duels and sees an eye score
- `/about` the circuit thesis
- `/rules` the public competition rules. The PDF is not served.
- `/videos` verdicted waves only; `/videos/[id]` plays one. Unjudged waves stay off this page
- `/calendar` the six Season 1 events
- `/board/best-tube` demo world board; other event slugs work the same way
- `/escrow` published payment orders, and an empty list of on-chain executions until a contract address exists. `/api/payment-orders` is the machine-readable file.
- `/ranking` eight world rankings
- `/purse` public purse, marked DEMO
- `/hashboards` an athlete's hashtag rankings; `/hashboards/[tag]` is one tag. `/t/[tag]` redirects there
- `/sign-up`, `/sign-in`, `/profile`, `/enter`, `/my-waves`
- `/athlete/[slug]` public placements
- `/judge` the first screen after sign-in: a full-screen blind duel, “Which wave goes higher?”. `/judge/ballot` is the list view. `/judge/history` your places
- `/lineup` The Lineup, verdicted waves only, with a Shaka and follow. A friend’s wave from this week stays locked until Monday
- `/eye` eye score, level, streaks, badges. Season points still come only from Monday
- `/verdict` the Monday drop
- `/videos/[id]/share` a 9:16 story card for a verdicted wave. `/videos/[id]/card` is the image
- `/invite/[token]` personal invite into a college
- `/admin/judge` seat the Chamber and the Ranked, override a college, mint an invite, and rerun Monday’s verdict
- `/admin/calibration` the pros’ answer key
- `/admin/review` waves waiting for a person, stored keyframes, and reports. One click bans the surfer

## Tests

`npm test` covers the ticket split, purse rails, founding-book totals, points curve, payout shares at every depth through 200 places, payment-order hashes, binary insertion, college median, hashtag renumbering, category bands, the six-event catalogue, the weekly ocean quota and the judging-duty gate.

## Not in v0.1

On-chain payout execution, Pix, cards, KYC, transcoding, a ride-date field, public accuracy boards, the Golden Eye, accuracy promotion into the Upper Chamber, the media house, sponsor checkout, patron tools, WhatsApp, and any balance the application increments. Video files can be uploaded and are checked for duplicates and title fit. An unpublished-wave attestation is required. Social networks are not searched automatically. The site publishes payment orders. An outside bot pays them. The Ranked cap of US$ 6 is applied when those orders are built. No money moves through the platform. `/rules` states the published competition rules, including the fields the entry form does not collect yet.
