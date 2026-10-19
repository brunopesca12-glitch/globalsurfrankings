# Payout protocol

Design only. No contract is deployed here, and no USDC moves. Deployment waits on an audit.

## What pays

Season 1 escrows six event tickets. Each ticket splits 78% athletes / 6% judges / 16% platform. The 78% is the season table, the weekly race, and the world champions' fund. The 6% is shared by the Champions panel and the pro tour panel.

Two clocks:

1. **Monday.** Pay the prior ISO week. Weekly race money follows that week's published places. Judge fees follow ballots sealed that week, capped for the pro tour panel.
2. **Season close.** Pay season tables and the world champions' fund from the final places.

Ocean entry is free. A pool toll, when it exists, is credited to the judges' share inside the same escrow. It is not charged by this website.

## Who receives it

The only destination is the public USDC address on the athlete or judge profile.

- Ethereum: `0x` and 40 hex characters.
- Solana: a base58 address.
- Another USDC network: one token, no spaces.

The site never asks for a seed phrase or a private key. A missing address means the payout waits. It is not redirected to someone else.

## Data flow

```
sealed places
  -> Monday verdict (median of panels that reached three ballots)
  -> payout schedule (week, or season close)
  -> amounts from the published curve
  -> wallet on the profile
  -> transfer from the funding account
  -> tx hash stored on the payout row
```

The website reads that row and shows it. It does not sign the transfer.

## Two ways to execute

Either is enough. Pick one after the audit. Do not run both against the same balance.

### Escrow contract

A contract holds USDC. Its address is published on `/escrow` once it exists. The schedule is a function call:

- `payWeek(year, week)` reads the published places for that week and transfers USDC to the stored wallets.
- `paySeason(vintage)` does the same for the annual awards.

A keeper, or the contract's own clock, calls it. There is no desk approval on the day. The amounts are the curve already in `lib/payout.ts` and `lib/constitution.ts`. The contract rejects a call that would pay a place twice.

### Circle programmable wallets, plus a scheduled job

Circle holds the funding account. A job runs Monday 00:10 UTC, and once at season close:

1. Read the verdict rows for the period.
2. Compute amounts with the same functions the site uses.
3. Skip any profile with no wallet.
4. Submit one USDC transfer per payee from the funding wallet.
5. Write the Circle transfer id and the chain tx hash back to the payout table.

The job has no editor. If a transfer fails, it retries the same amount. It does not invent a new one.

## What this repository does now

`/escrow` shows a placeholder address, a demo balance equal to the Season 1 book, a demo deposit from the Founding Presenter (Circle), and sample payout rows. Every one of those rows is labelled demo. `app/rules` states the clocks and the split. Profile and sign-up store a public address after `lib/wallet.ts` accepts the format.

The placeholder address is not a deployment.
