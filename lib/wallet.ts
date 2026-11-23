export const WALLET_NETWORKS = ["ethereum", "solana", "other"] as const;
export type WalletNetwork = (typeof WALLET_NETWORKS)[number];

export function isWalletNetwork(value: string): value is WalletNetwork {
  return (WALLET_NETWORKS as readonly string[]).includes(value);
}

/**
 * A public payout address. Seed phrases and private keys are rejected
 * because they contain spaces or the wrong shape. Nothing secret is stored.
 */
export function parseWallet(network: string, address: string): { network: WalletNetwork; address: string } | null {
  if (!isWalletNetwork(network)) return null;
  const trimmed = address.trim();
  if (trimmed.length === 0 || /\s/.test(trimmed)) return null;
  if (network === "ethereum") {
    return /^0x[a-fA-F0-9]{40}$/.test(trimmed) ? { network, address: trimmed } : null;
  }
  if (network === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed) ? { network, address: trimmed } : null;
  }
  if (trimmed.length < 20 || trimmed.length > 128) return null;
  if (!/^[A-Za-z0-9:_-]+$/.test(trimmed)) return null;
  return { network, address: trimmed };
}
