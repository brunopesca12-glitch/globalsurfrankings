/**
 * Which demo rows a launch cleanup keeps.
 * Tube (barrel) and Big Surf stay. Every other demo row is listed for deletion.
 * Real accounts, and the desk, are left alone.
 */

export type CleanupEntry = {
  id: string;
  userId: string;
  videoUrl: string;
  spot: string | null;
  themeSlug: string;
  themeName: string;
  athleteName: string;
  athleteEmail: string;
  athleteSlug: string;
  walletAddress: string | null;
};

export type CleanupUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  displayName: string | null;
  slug: string | null;
  walletAddress: string | null;
};

export type CleanupDecision = {
  keepEntries: { id: string; label: string }[];
  deleteEntries: { id: string; label: string }[];
  keepUsers: { id: string; email: string; reason: string }[];
  deleteUsers: { id: string; email: string; reason: string }[];
};

const KEPT_SLUGS = new Set(["best-tube", "best-barrel", "biggest-paddle-in", "big-surf", "big-wave"]);

export function titleIsKept(theme: { slug: string; name: string }): boolean {
  const slug = theme.slug.trim().toLowerCase();
  if (KEPT_SLUGS.has(slug)) return true;
  const name = theme.name.trim().toLowerCase();
  if (name.includes("tube") || name.includes("barrel")) return true;
  if (
    name.includes("big surf") ||
    name.includes("biggest paddle") ||
    name.includes("big wave") ||
    name.includes("big-wave")
  ) {
    return true;
  }
  return false;
}

export function isDemoIdentity(input: {
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  slug?: string | null;
  walletAddress?: string | null;
  role?: string | null;
}): boolean {
  if (input.role === "ADMIN") return false;
  const name = `${input.name ?? ""} ${input.displayName ?? ""}`.trim().toLowerCase();
  if (name === "demo athlete" || name === "demo judge" || name.startsWith("demo list")) return true;
  const email = (input.email ?? "").trim().toLowerCase();
  if (email.startsWith("demo-list")) return true;
  if ((input.slug ?? "").trim().toLowerCase().startsWith("demo-list-")) return true;
  if (/^0x1111/i.test(input.walletAddress ?? "")) return true;
  if (email.includes("qa-test") || email.includes("+qa")) return true;
  return false;
}

export function isDemoWave(entry: Pick<CleanupEntry, "videoUrl" | "spot" | "athleteName" | "athleteEmail" | "athleteSlug" | "walletAddress">): boolean {
  const url = entry.videoUrl.toLowerCase();
  if (url.includes("video.gsr.surf/demo") || url.includes("demo.gsr.surf") || url.includes("upload.gsr.surf")) return true;
  const spot = (entry.spot ?? "").trim().toLowerCase();
  if (spot === "demo break" || spot === "demo pool" || spot.startsWith("demo ") || /\bqa\b/.test(spot)) return true;
  if (/\bqa\b/i.test(entry.athleteName) || entry.athleteEmail.toLowerCase().includes("qa")) return true;
  return isDemoIdentity({
    displayName: entry.athleteName,
    email: entry.athleteEmail,
    slug: entry.athleteSlug,
    walletAddress: entry.walletAddress,
  });
}

function entryLabel(entry: CleanupEntry): string {
  return `${entry.id} ${entry.themeSlug} ${entry.athleteName} ${entry.videoUrl}`;
}

/**
 * Demo waves on Tube/barrel and Big Surf are kept.
 * Demo waves on every other title are deleted.
 * A demo account is deleted only when none of its rows are kept and it has no real wave.
 */
export function planDemoCleanup(entries: readonly CleanupEntry[], users: readonly CleanupUser[]): CleanupDecision {
  const keepEntries: CleanupDecision["keepEntries"] = [];
  const deleteEntries: CleanupDecision["deleteEntries"] = [];
  const keptUserIds = new Set<string>();

  for (const entry of entries) {
    if (!isDemoWave(entry)) {
      keptUserIds.add(entry.userId);
      continue;
    }
    if (titleIsKept({ slug: entry.themeSlug, name: entry.themeName })) {
      keepEntries.push({ id: entry.id, label: entryLabel(entry) });
      keptUserIds.add(entry.userId);
    } else {
      deleteEntries.push({ id: entry.id, label: entryLabel(entry) });
    }
  }

  const keepUsers: CleanupDecision["keepUsers"] = [];
  const deleteUsers: CleanupDecision["deleteUsers"] = [];
  for (const user of users) {
    if (user.role === "ADMIN") continue;
    const demo = isDemoIdentity({
      name: user.name,
      displayName: user.displayName,
      email: user.email,
      slug: user.slug,
      walletAddress: user.walletAddress,
      role: user.role,
    });
    if (!demo) continue;
    if (keptUserIds.has(user.id)) {
      keepUsers.push({ id: user.id, email: user.email, reason: "demo account with a kept Tube or Big Surf wave, or a real wave" });
    } else {
      deleteUsers.push({ id: user.id, email: user.email, reason: "demo account with nothing kept" });
    }
  }

  return { keepEntries, deleteEntries, keepUsers, deleteUsers };
}
