import { merkleRoot, sha256Hex } from "../lib/receipt";

const [command, ...rest] = process.argv.slice(2);

if (command === "hash" && rest[0]) {
  process.stdout.write(`${sha256Hex(rest[0].trim())}\n`);
} else if (command === "root") {
  const leaves = rest.map((leaf) => leaf.trim().toLowerCase()).filter((leaf) => /^[0-9a-f]{64}$/.test(leaf));
  process.stdout.write(`${merkleRoot(leaves)}\n`);
} else {
  process.stderr.write(
    ["Usage:", "  npx tsx scripts/verify-receipt.ts hash 'voteId|subject|probe|BETTER|J-CODE|timestamp|nonce'", "  npx tsx scripts/verify-receipt.ts root <hash> <hash> ...", ""].join("\n"),
  );
  process.exit(1);
}
