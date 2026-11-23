import { openFreshComparison } from "@/lib/fresh-ballot";

const email = process.argv[2]?.trim();
if (!email) {
  console.error("Usage: npx tsx scripts/open-comparison-ballot.ts <email>");
  process.exit(1);
}

const result = await openFreshComparison(email);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
