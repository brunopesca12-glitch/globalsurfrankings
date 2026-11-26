"use server";

import { merkleRoot, sha256Hex } from "@/lib/receipt";

export async function hashReceiptLine(line: string): Promise<string> {
  return sha256Hex(line.trim());
}

export async function rootFromHashes(raw: string): Promise<string> {
  const leaves = raw
    .split(/\s+/)
    .map((leaf) => leaf.trim().toLowerCase())
    .filter((leaf) => /^[0-9a-f]{64}$/.test(leaf));
  return merkleRoot(leaves);
}
