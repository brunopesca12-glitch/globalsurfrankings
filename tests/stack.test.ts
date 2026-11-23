import { describe, expect, it } from "vitest";
import { confirmPlaceCopy, stackAfterInsert } from "@/lib/stack";
import { parseWallet } from "@/lib/wallet";

describe("place the wave", () => {
  it("inserts into the judge's list and shifts the rest down", () => {
    expect(stackAfterInsert(["a", "b", "c"], "new", 2)).toEqual(["a", "new", "b", "c"]);
    expect(stackAfterInsert([], "new", 1)).toEqual(["new"]);
    expect(stackAfterInsert(["a"], "new", 3)).toBeNull();
    expect(confirmPlaceCopy(24, 37)).toBe("Place this wave at #24? The current #24 moves to #25.");
    expect(confirmPlaceCopy(1, 0)).toBe("Set this wave as #1?");
  });
});

describe("wallet", () => {
  it("accepts a public address and rejects a seed phrase", () => {
    expect(parseWallet("ethereum", "0x" + "ab".repeat(20))?.address).toHaveLength(42);
    expect(parseWallet("solana", "So11111111111111111111111111111111111111112")).not.toBeNull();
    expect(parseWallet("ethereum", "abandon abandon abandon abandon")).toBeNull();
    expect(parseWallet("other", "usdc:example-address-0001")).not.toBeNull();
  });
});