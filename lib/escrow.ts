import { FOUNDING } from "@/lib/constitution";

/**
 * Demo mirror of the funding account. No contract is deployed and no USDC has moved.
 * Figures follow the Season 1 book so the page matches the purse.
 */
export const ESCROW_MIRROR = {
  deployed: false,
  network: "Ethereum",
  asset: "USDC",
  address: "0x0000000000000000000000000000000000000511",
  presenter: "Founding Presenter (Circle)",
  committedUsd: FOUNDING.seasonBookCashUsd,
  paidUsd: 0,
  balanceUsd: FOUNDING.seasonBookCashUsd,
  deposits: [
    {
      id: "demo-deposit-1",
      from: "Founding Presenter (Circle)",
      usd: FOUNDING.seasonBookCashUsd,
      note: "Season 1 tickets, six events",
      tx: "0xdemo0000000000000000000000000000000000000000000000000000000001",
    },
  ],
  payouts: [
    {
      id: "demo-payout-1",
      when: "Monday · sample week",
      to: "Weekly race",
      usd: FOUNDING.weeklyPerMondayUsd,
      tx: "0xdemo0000000000000000000000000000000000000000000000000000000002",
    },
    {
      id: "demo-payout-2",
      when: "End of season · sample",
      to: "Season tables and world champions",
      usd: FOUNDING.seasonTableUsd * 6 + FOUNDING.overallUsd * 6,
      tx: "0xdemo0000000000000000000000000000000000000000000000000000000003",
    },
  ],
} as const;
