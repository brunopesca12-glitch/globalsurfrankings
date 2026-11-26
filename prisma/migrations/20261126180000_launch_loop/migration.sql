-- AlterTable
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3),
ADD COLUMN "banReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN "calibrationPro" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN "countsForRanking" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "capturedAt" TIMESTAMP(3),
ADD COLUMN "captureDevice" TEXT,
ADD COLUMN "captureLat" DOUBLE PRECISION,
ADD COLUMN "captureLng" DOUBLE PRECISION,
ADD COLUMN "metadataNote" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shaka" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shaka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryKeyframe" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "EntryKeyframe_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "HigherSide" AS ENUM ('LEFT', 'RIGHT');

-- CreateTable
CREATE TABLE "CalibrationDuel" (
    "id" TEXT NOT NULL,
    "leftEntryId" TEXT NOT NULL,
    "rightEntryId" TEXT NOT NULL,
    "higher" "HigherSide",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationDuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationVote" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "higher" "HigherSide" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationAnswer" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "userId" TEXT,
    "guestKey" TEXT,
    "higher" "HigherSide" NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EyeDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "duels" INTEGER NOT NULL DEFAULT 0,
    "calibrations" INTEGER NOT NULL DEFAULT 0,
    "calibrationHits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EyeDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_athleteId_key" ON "Follow"("followerId", "athleteId");
CREATE INDEX "Follow_athleteId_idx" ON "Follow"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "Shaka_userId_entryId_key" ON "Shaka"("userId", "entryId");
CREATE INDEX "Shaka_entryId_idx" ON "Shaka"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "EntryKeyframe_entryId_position_key" ON "EntryKeyframe"("entryId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationDuel_leftEntryId_rightEntryId_key" ON "CalibrationDuel"("leftEntryId", "rightEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationVote_duelId_userId_key" ON "CalibrationVote"("duelId", "userId");

-- CreateIndex
CREATE INDEX "CalibrationAnswer_userId_createdAt_idx" ON "CalibrationAnswer"("userId", "createdAt");
CREATE INDEX "CalibrationAnswer_guestKey_idx" ON "CalibrationAnswer"("guestKey");

-- CreateIndex
CREATE UNIQUE INDEX "EyeDay_userId_day_key" ON "EyeDay"("userId", "day");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Shaka" ADD CONSTRAINT "Shaka_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shaka" ADD CONSTRAINT "Shaka_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EntryKeyframe" ADD CONSTRAINT "EntryKeyframe_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalibrationDuel" ADD CONSTRAINT "CalibrationDuel_leftEntryId_fkey" FOREIGN KEY ("leftEntryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalibrationDuel" ADD CONSTRAINT "CalibrationDuel_rightEntryId_fkey" FOREIGN KEY ("rightEntryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalibrationVote" ADD CONSTRAINT "CalibrationVote_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "CalibrationDuel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalibrationVote" ADD CONSTRAINT "CalibrationVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalibrationAnswer" ADD CONSTRAINT "CalibrationAnswer_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "CalibrationDuel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EyeDay" ADD CONSTRAINT "EyeDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
