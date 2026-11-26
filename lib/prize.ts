import { formatUsd } from "@/lib/format";

/** Shown in every prize-money column while no sponsor purse is published. */
export const MONEY_BLANK = "—";

/**
 * Prize-money figures are published only when GSR_PRIZE_MONEY is on.
 * Default is off: columns stay on screen and stay blank. No invented amounts.
 */
export function prizeMoneyPublished(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env.GSR_PRIZE_MONEY?.trim().toLowerCase() ?? "";
  return flag === "on" || flag === "1" || flag === "true";
}

export function formatMoneyColumn(cents: number | null | undefined): string {
  if (cents == null) return MONEY_BLANK;
  return formatUsd(cents);
}
