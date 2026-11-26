/**
 * Production builds migrate DATABASE_URL.
 * Preview builds do not. They migrate only when PREVIEW_DATABASE_URL is set
 * and is different from DATABASE_URL.
 * A local build migrates DATABASE_URL when it is set, and skips when it is not.
 */
import { spawnSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;
const databaseUrl = process.env.DATABASE_URL ?? "";
const previewUrl = process.env.PREVIEW_DATABASE_URL ?? "";

function migrate(url) {
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
  process.exit(result.status === null ? 1 : result.status);
}

if (vercelEnv === "preview") {
  if (!previewUrl) {
    console.log(
      "Skipping prisma migrate deploy on this preview build. Preview must not migrate DATABASE_URL, which may be production. Set PREVIEW_DATABASE_URL to a separate database, and set the Preview DATABASE_URL to that same database.",
    );
    process.exit(0);
  }
  if (previewUrl === databaseUrl) {
    console.error("Refusing to migrate: PREVIEW_DATABASE_URL matches DATABASE_URL.");
    process.exit(1);
  }
  console.log("Migrating PREVIEW_DATABASE_URL.");
  migrate(previewUrl);
} else if (vercelEnv === "production") {
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  migrate(databaseUrl);
} else if (!process.env.VERCEL) {
  if (!databaseUrl) {
    console.log("Skipping prisma migrate deploy: DATABASE_URL is not set.");
    process.exit(0);
  }
  migrate(databaseUrl);
} else {
  console.log(`Skipping prisma migrate deploy (VERCEL_ENV=${vercelEnv ?? "unset"}).`);
  process.exit(0);
}
