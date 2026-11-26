/**
 * Removes demo rows. Refuses to run unless you pass --dry-run or --apply.
 *
 * Kept: demo waves on Tube/barrel (best-tube, best-barrel) and Big Surf
 * (biggest-paddle-in, big-surf, big-wave, and titles named that way).
 * Deleted: other demo waves, Demo list / Demo Athlete / Demo Judge accounts
 * that have nothing kept, and accounts whose wallet starts with 0x1111.
 *
 * Sample escrow orders are built in code, not stored. This script does not
 * invent deletes for them. A stored wallet starting with 0x1111 is included.
 *
 * Do not run this against production until you have a backup.
 */
import { PrismaClient } from "@prisma/client";
import { planDemoCleanup, type CleanupEntry, type CleanupUser } from "../lib/demo-cleanup";

const prisma = new PrismaClient();

function flag(): "dry-run" | "apply" | null {
  const args = new Set(process.argv.slice(2));
  const dry = args.has("--dry-run");
  const apply = args.has("--apply");
  if (dry === apply) return null;
  return dry ? "dry-run" : "apply";
}

async function main() {
  const mode = flag();
  if (!mode) {
    console.error("Refusing to run. Pass --dry-run to list what would be kept and deleted, or --apply to delete.");
    process.exitCode = 1;
    return;
  }

  const entries = await prisma.entry.findMany({
    select: {
      id: true,
      videoUrl: true,
      spot: true,
      athlete: {
        select: {
          id: true,
          displayName: true,
          slug: true,
          walletAddress: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
      theme: { select: { slug: true, name: true } },
    },
  });
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      athlete: { select: { displayName: true, slug: true, walletAddress: true } },
    },
  });

  const cleanupEntries: CleanupEntry[] = entries.map((entry) => ({
    id: entry.id,
    userId: entry.athlete.userId,
    videoUrl: entry.videoUrl,
    spot: entry.spot,
    themeSlug: entry.theme.slug,
    themeName: entry.theme.name,
    athleteName: entry.athlete.displayName,
    athleteEmail: entry.athlete.user.email,
    athleteSlug: entry.athlete.slug,
    walletAddress: entry.athlete.walletAddress,
  }));
  const cleanupUsers: CleanupUser[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    displayName: user.athlete?.displayName ?? null,
    slug: user.athlete?.slug ?? null,
    walletAddress: user.athlete?.walletAddress ?? null,
  }));

  const plan = planDemoCleanup(cleanupEntries, cleanupUsers);
  console.log(mode === "dry-run" ? "Dry run. Nothing will be deleted." : "Applying deletes.");
  console.log(`Kept demo waves (${plan.keepEntries.length}), Tube/barrel and Big Surf:`);
  for (const row of plan.keepEntries) console.log(`  keep entry ${row.label}`);
  console.log(`Deleted demo waves (${plan.deleteEntries.length}):`);
  for (const row of plan.deleteEntries) console.log(`  delete entry ${row.label}`);
  console.log(`Kept demo accounts (${plan.keepUsers.length}):`);
  for (const row of plan.keepUsers) console.log(`  keep user ${row.email} — ${row.reason}`);
  console.log(`Deleted demo accounts (${plan.deleteUsers.length}):`);
  for (const row of plan.deleteUsers) console.log(`  delete user ${row.email} — ${row.reason}`);
  console.log("Sample escrow orders are not database rows. Wallets starting with 0x1111 are covered above when stored.");

  if (mode === "dry-run") return;

  const deleteUserIds = new Set(plan.deleteUsers.map((row) => row.id));
  const entryIds = plan.deleteEntries
    .filter((row) => {
      const entry = cleanupEntries.find((item) => item.id === row.id);
      return entry ? !deleteUserIds.has(entry.userId) : true;
    })
    .map((row) => row.id);

  await prisma.$transaction(async (tx) => {
    if (entryIds.length > 0) {
      await tx.entry.deleteMany({ where: { id: { in: entryIds } } });
    }
    if (deleteUserIds.size > 0) {
      await tx.user.deleteMany({ where: { id: { in: [...deleteUserIds] } } });
    }
  });
  console.log(`Deleted ${entryIds.length} entries and ${deleteUserIds.size} users.`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "cleanup failed";
    console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgresql://redacted"));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
