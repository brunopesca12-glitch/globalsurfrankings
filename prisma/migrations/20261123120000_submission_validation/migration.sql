-- Additive submission checks. Existing rows keep their data.
-- New columns use defaults, so current entries stay CLEAR and are not rewritten by hand.
-- A null contentSha256 means the file was never hashed. Postgres allows many nulls under the unique index.

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('CLEAR', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "ModalityCheck" AS ENUM ('FIT', 'UNCERTAIN', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "contentSha256" TEXT,
ADD COLUMN "frameHashes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "unpublishedAttested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attestationText" TEXT NOT NULL DEFAULT '',
ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CLEAR',
ADD COLUMN "modalityCheck" "ModalityCheck",
ADD COLUMN "modalityNote" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "EntryMedia" (
    "entryId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "EntryMedia_pkey" PRIMARY KEY ("entryId")
);

-- CreateTable
CREATE TABLE "PublicationFlag" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PublicationFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entry_contentSha256_key" ON "Entry"("contentSha256");

-- CreateIndex
CREATE INDEX "Entry_reviewStatus_idx" ON "Entry"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationFlag_entryId_userId_key" ON "PublicationFlag"("entryId", "userId");

-- CreateIndex
CREATE INDEX "PublicationFlag_resolvedAt_idx" ON "PublicationFlag"("resolvedAt");

-- AddForeignKey
ALTER TABLE "EntryMedia" ADD CONSTRAINT "EntryMedia_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationFlag" ADD CONSTRAINT "PublicationFlag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationFlag" ADD CONSTRAINT "PublicationFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
