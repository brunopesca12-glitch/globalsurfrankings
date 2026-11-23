import { openFreshComparison } from "@/lib/fresh-ballot";

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error("Usage: npx tsx scripts/open-comparison-ballot.ts <email>");
    process.exit(1);
  }
  const result = await openFreshComparison(email);
  console.log(`GSR_BALLOT_RESULT ${JSON.stringify(result)}`);
  if (!result.ok) process.exit(1);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "ballot script failed";
  console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgresql://redacted"));
  process.exit(1);
});
