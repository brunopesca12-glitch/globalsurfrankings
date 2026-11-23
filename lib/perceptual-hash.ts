/** 64-bit difference hash. Flat frames (all zeros or all ones) carry no picture. */
export const HASH_BITS = 64;
/** Hamming distance at or under this counts as the same picture after a re-save, resize, or mild crop. */
export const NEAR_DISTANCE = 12;
/** How many sampled frames must agree before two clips are the same wave. */
export const NEAR_MIN_MATCHES = 4;

const NIBBLE_BITS = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4] as const;

export function dHashFromGray(pixels: Uint8Array, width: number, height: number): string {
  let bits = BigInt(0);
  let bit = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const left = pixels[y * width + x] ?? 0;
      const right = pixels[y * width + x + 1] ?? 0;
      if (left > right) bits |= BigInt(1) << BigInt(HASH_BITS - 1 - bit);
      bit += 1;
    }
  }
  return bits.toString(16).padStart(HASH_BITS / 4, "0");
}

export function hammingHex(left: string, right: string): number {
  if (left.length !== right.length || left.length === 0) return HASH_BITS;
  let distance = 0;
  for (let i = 0; i < left.length; i += 1) {
    const a = Number.parseInt(left[i]!, 16);
    const b = Number.parseInt(right[i]!, 16);
    if (!Number.isInteger(a) || !Number.isInteger(b)) return HASH_BITS;
    distance += NIBBLE_BITS[a ^ b] ?? 0;
  }
  return distance;
}

/** A flat frame hashes to all zeros or all ones and is ignored. */
export function informativeHash(hash: string): boolean {
  return /^[0-9a-f]{16}$/.test(hash) && !/^0+$/.test(hash) && !/^f+$/.test(hash);
}

/**
 * True when enough sampled frames of `incoming` sit close to frames of `stored`.
 * Comparison is unordered, so a trim still meets the frames it shares.
 */
export function isNearDuplicate(incoming: readonly string[], stored: readonly string[]): boolean {
  const left = incoming.filter(informativeHash);
  const right = stored.filter(informativeHash);
  if (left.length < NEAR_MIN_MATCHES || right.length < NEAR_MIN_MATCHES) return false;
  let matched = 0;
  for (const hash of left) {
    let best = HASH_BITS;
    for (const other of right) {
      const distance = hammingHex(hash, other);
      if (distance < best) best = distance;
    }
    if (best <= NEAR_DISTANCE) matched += 1;
  }
  return matched >= NEAR_MIN_MATCHES;
}
