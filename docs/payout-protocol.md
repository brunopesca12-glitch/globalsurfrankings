# Payout protocol

This repository publishes payment orders. It does not pay them.

Payouts run on a public blockchain, from an executor bot that is not part of this codebase. GSR does not hold private keys, does not sign, does not submit transfers, and does not call a payments API. The 16% platform share is not an order: no platform address is invented here.

## What the site publishes

An order is a pure function of the current verdicts and the rules in `lib/constitution.ts` and `lib/payout.ts`.

| Field | Meaning |
| --- | --- |
| `id` | Stable identity of the line. Amounts and wallets can change; the id does not. |
| `period` | `2027-W09` for a week, or `2027-season` for the annual file. |
| `clock` | `monday` or `season_close`. |
| `payOn` | Earliest date the bot may pay the file. |
| `event`, `eventSlug`, `board` | Event and edition. Empty for a judge's weekly fee. |
| `placement` | Board place. `1` on the champions' fund. Empty for judges. |
| `ballots` | Sealed ballots that week, for a judge. Empty otherwise. |
| `recipientId`, `recipientName` | Athlete or judge. |
| `walletNetwork`, `walletAddress` | Public USDC address. Ethereum, Solana, or one other token. |
| `amountCents`, `amountUsdc`, `amountBaseUnits` | The same amount. 1 cent = 10,000 base units. 1 USDC = 1,000,000 base units. |
| `splitBasis` | `weekly_race`, `season_table`, `champions_fund`, `judges_champions`, or `judges_pro_tour`. |
| `ruleRef` | `gsr-orders-1#weekly-race`, `#season-table`, `#champions-fund`, `#judges-champions`, or `#judges-pro-tour`. |
| `status` | `published` when the wallet parses. `awaiting_wallet` when it does not. |

`awaiting_wallet` still appears in the file. The amount is not given to anyone else. `executed` is not a status this app sets.

## Two clocks

1. **Monday.** Period is the ISO week just finished. `payOn` is the Monday after that week. The file holds the weekly race for waves entered that week, and the judges' fee for Champions and pro tour ballots sealed that week.
2. **Season close.** Period is `2027-season`. `payOn` is the season's last day, 30 September 2027. The file holds season tables and the world champions' fund. The bot must not pay it before that date. The hash moves as standings move. Pay the hash published at season close.

The season runs 1 March 2027 through 30 September 2027. That span contains 31 Mondays. The printed purse divides the weekly race and the judges' fee by 30 (US$ 9,300 a Monday). The order file divides both by those 31 Mondays, so every share is an integer number of cents and the shares sum to the season totals. The weekly race is US$ 9,000.00 each of those Mondays. The index field `foundingWeekCount` records the printed 30.

A week with no places publishes an empty file. Its money is not moved onto another week.

## How the amounts are chosen

Rules version: `gsr-orders-1`.

Season 1 is six events. Each ticket is US$ 400,000: 78% athletes, 6% judges, 16% platform. Of the 78%: season table US$ 232,000, weekly race US$ 46,500, world champions' fund US$ 33,500. The judges' 6% is half Champions, half pro tour.

**Weekly race.** The week's cents are split across the eight editions by the published edition weights. An edition with no wave that week publishes nothing for its share. Inside an edition, the cents are split across boards in proportion to how many waves were placed, then along the payout curve for that week's field, ordered by current board place. The top fifth is paid. Six or fewer paid places take the whole board slice on 35 / 20 / 14 / 12 / 10 / 9.

**Season table.** Each event has its own table. Edition weights, then the same curve, indexed by board place. The field size is submitted plus placed waves. Places that are not filled yet are not orders, and their cents are not redistributed.

**Champions' fund.** One order per edition, for the athlete with the most season points. A tie breaks to the lower athlete id. The order id is the edition slot, so a new leader keeps the same id and changes the file's hash.

**Judges.** The week's judge cents are split in half. Each half is split equally across judges who sealed at least one ballot that week on a Season 1 event. The pro tour is then capped at US$ 6 times that judge's ballots. The capped remainder is not given to anyone else. Champions are not capped. Athletes, Top 10, and Everyone are not paid from this fee.

Only Season 1 events are included. A missing wallet, or an address `lib/wallet.ts` rejects, sets `awaiting_wallet` and clears the address.

## Files

- `GET /api/payment-orders` — index of every week plus the season file. Each row has `payOn`, the order count, the content hash, and `href`.
- `GET /api/payment-orders/{period}` — one file. Unknown periods return 404.
- `GET /api/payment-orders/demo` — a sample file. `demo` is true and `payable` is false. Every order in it has `demo: true`. The executor must not pay it. It exists so a person can check the shape before the season has verdicts. Week files do not contain these rows.

While the site preview password is on, these URLs ask for that same password. They do not ask for a signed-in user.

Both responses are canonical JSON: object keys sorted, no insignificant whitespace. `Content-Type` is `application/json`. `ETag` is the content hash in double quotes. `Cache-Control` is `public, max-age=60`.

`rulesVersion` is `gsr-orders-1`. A change to the math bumps that version. Old hashes stop matching on purpose.

## Verifying a file

There is no signature. This repo has no key that could sign one. Verification is the content hash:

1. Parse the JSON.
2. Remove the top-level `contentHash`.
3. Sort every object's keys recursively. Leave arrays in their existing order. Orders are already sorted by `id`.
4. `JSON.stringify` that value, UTF-8, with no extra whitespace.
5. SHA-256, hex, must equal `contentHash`.

`verifyContentHash` in `lib/payment-orders.ts` does this. A timestamp is not part of the document. Editing an amount, a wallet, or a place changes the hash.

## What the executor bot does

The bot is operated outside this repository.

1. `GET` the period file.
2. Recompute the content hash. Refuse the file if it does not match.
3. Refuse the file before `payOn`. Refuse `2027-season` before 30 September 2027.
4. For each order with status `published`, transfer `amountBaseUnits` of USDC to `walletAddress` on `walletNetwork`.
5. Skip `awaiting_wallet`.
6. Store the content hash it paid.
7. Never pay a second content hash for the same period. A later file replaces the previous one; it is not a second bill.
8. Never pay an order id that is absent from the hash it accepted.

Weekly hashes can change if a later result moves an older board place. Read the weekly file on its `payOn` date, after that Monday's verdict, and pay that hash once. Season hashes are expected to change until season close.

This site does not learn whether the bot paid. `/escrow` shows the published orders beside executed transaction hashes. The executed list is read from public chain data only. `lib/escrow.ts` holds no address and no hashes until a public contract address exists. Empty means not deployed. It does not mean a demo transfer.

## Human page

`/escrow` lists the same orders a person can read: period, event, board, place, wallet, USDC amount, split, rule, status, and a blank executed column. The index hash and the per-period JSON links are on that page.
