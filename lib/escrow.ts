/**
 * Public chain reading for the escrow page.
 * No contract address is known. This module never stores a key, never signs,
 * and never submits a transfer. Transaction hashes are added only when a
 * public address exists and the hash was read from that chain.
 */
export const CHAIN_EXECUTION = {
  source: "public-chain" as const,
  contractAddress: null as string | null,
  network: null as string | null,
  asset: "USDC" as const,
  transactions: [] as readonly { orderId: string; txHash: string }[],
};
