-- CreateEnum
CREATE TYPE "HoldReason" AS ENUM ('NONE', 'QUORUM', 'APPEAL');
CREATE TYPE "VoteConfidence" AS ENUM ('CONFIDENT', 'UNSURE');

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "holdReason" "HoldReason" NOT NULL DEFAULT 'NONE',
ADD COLUMN "rolloverCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "appealFallback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastHoldYear" INTEGER,
ADD COLUMN "lastHoldWeek" INTEGER;

-- AlterTable
ALTER TABLE "Ballot" ADD COLUMN "appeal" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VoteCommit" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "probeEntryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pseudonym" TEXT NOT NULL,
    "choice" "ComparisonResult" NOT NULL,
    "nonce" TEXT NOT NULL,
    "committedAt" TIMESTAMP(3) NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "confidence" "VoteConfidence",
    "eyeScore" INTEGER NOT NULL,
    "eyeLevel" TEXT NOT NULL,
    "qualified" BOOLEAN NOT NULL,
    "calibrated" BOOLEAN NOT NULL,
    "themeSlug" TEXT NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,

    CONSTRAINT "VoteCommit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekRoot" (
    "id" TEXT NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chainTx" TEXT,

    CONSTRAINT "WeekRoot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoteCommit_comparisonId_key" ON "VoteCommit"("comparisonId");
CREATE INDEX "VoteCommit_entryId_idx" ON "VoteCommit"("entryId");
CREATE INDEX "VoteCommit_isoYear_isoWeek_idx" ON "VoteCommit"("isoYear", "isoWeek");
CREATE INDEX "VoteCommit_userId_idx" ON "VoteCommit"("userId");
CREATE UNIQUE INDEX "WeekRoot_isoYear_isoWeek_key" ON "WeekRoot"("isoYear", "isoWeek");

-- AddForeignKey
ALTER TABLE "VoteCommit" ADD CONSTRAINT "VoteCommit_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "BallotComparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoteCommit" ADD CONSTRAINT "VoteCommit_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoteCommit" ADD CONSTRAINT "VoteCommit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
