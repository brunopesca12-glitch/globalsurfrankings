/**
 * Pool verification toll, in cents. Off unless GSR_POOL_FEE_CENTS is a positive integer.
 * "0" and "off" keep entry free. Ocean entry is always free.
 */
export function poolFeeCents(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.GSR_POOL_FEE_CENTS?.trim().toLowerCase() ?? "";
  if (raw === "" || raw === "0" || raw === "off" || raw === "false") return 0;
  if (!/^\d+$/.test(raw)) return 0;
  const cents = Number(raw);
  if (!Number.isSafeInteger(cents) || cents < 0) return 0;
  return cents;
}
