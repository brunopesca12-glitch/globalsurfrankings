-- AlterTable
ALTER TABLE "User" ADD COLUMN "collegeOverride" "College",
ADD COLUMN "judgeOnboardedAt" TIMESTAMP(3),
ADD COLUMN "judgeNamePublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BallotComparison" ADD COLUMN "loBefore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "hiBefore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "anchored" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "JudgeInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "college" "College" NOT NULL,
    "email" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,

    CONSTRAINT "JudgeInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JudgeInvite_token_key" ON "JudgeInvite"("token");

-- CreateIndex
CREATE INDEX "JudgeInvite_email_idx" ON "JudgeInvite"("email");
