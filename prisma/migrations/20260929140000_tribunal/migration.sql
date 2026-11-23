-- CreateEnum
CREATE TYPE "College" AS ENUM ('CHAMBER', 'RANKED', 'ATHLETES', 'UPPER', 'PUBLIC');

-- CreateEnum
CREATE TYPE "BallotStatus" AS ENUM ('OPEN', 'SEALED');

-- CreateEnum
CREATE TYPE "ComparisonResult" AS ENUM ('BETTER', 'WORSE');

-- CreateTable
CREATE TABLE "CollegeSeat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "college" "College" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollegeSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "college" "College" NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "status" "BallotStatus" NOT NULL DEFAULT 'OPEN',
    "boardEntryIds" TEXT[],
    "lo" INTEGER NOT NULL DEFAULT 0,
    "hi" INTEGER NOT NULL,
    "place" INTEGER,
    "sealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallotComparison" (
    "id" TEXT NOT NULL,
    "ballotId" TEXT NOT NULL,
    "probeIndex" INTEGER NOT NULL,
    "probeEntryId" TEXT NOT NULL,
    "result" "ComparisonResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BallotComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerdictRun" (
    "id" TEXT NOT NULL,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "placed" INTEGER NOT NULL,
    "held" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerdictRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeVerdict" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "college" "College" NOT NULL,
    "place" INTEGER,
    "ballots" INTEGER NOT NULL,
    "runId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollegeVerdict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollegeSeat_userId_college_key" ON "CollegeSeat"("userId", "college");

-- CreateIndex
CREATE INDEX "Ballot_entryId_college_idx" ON "Ballot"("entryId", "college");

-- CreateIndex
CREATE INDEX "Ballot_userId_isoYear_isoWeek_idx" ON "Ballot"("userId", "isoYear", "isoWeek");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_userId_entryId_key" ON "Ballot"("userId", "entryId");

-- CreateIndex
CREATE INDEX "BallotComparison_ballotId_idx" ON "BallotComparison"("ballotId");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeVerdict_entryId_college_key" ON "CollegeVerdict"("entryId", "college");

-- AddForeignKey
ALTER TABLE "CollegeSeat" ADD CONSTRAINT "CollegeSeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotComparison" ADD CONSTRAINT "BallotComparison_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "Ballot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeVerdict" ADD CONSTRAINT "CollegeVerdict_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeVerdict" ADD CONSTRAINT "CollegeVerdict_runId_fkey" FOREIGN KEY ("runId") REFERENCES "VerdictRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
