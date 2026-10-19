-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ATHLETE', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationTier" AS ENUM ('VERIFIED', 'VERIFIED_PRO');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('M', 'W');

-- CreateEnum
CREATE TYPE "CategoryCode" AS ENUM ('OPEN', 'JUNIOR', 'MASTERS_40', 'MASTERS_50');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('OCEAN', 'POOL');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('SUBMITTED', 'PLACED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ATHLETE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "verification" "VerificationTier" NOT NULL DEFAULT 'VERIFIED',
    "sex" "Sex" NOT NULL,
    "birthDate" DATE NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "city" TEXT,
    "club" TEXT,
    "hashtags" TEXT[],
    "bio" TEXT,
    "judgingDutyCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "vintage" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "ageAsOf" DATE NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "finaleOn" DATE NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "open" BOOLEAN NOT NULL,
    "junior" BOOLEAN NOT NULL,
    "masters40" BOOLEAN NOT NULL,
    "masters50" BOOLEAN NOT NULL,
    "oceanOnly" BOOLEAN NOT NULL,
    "poolOnly" BOOLEAN NOT NULL,
    "proposed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "spot" TEXT,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "tollCents" INTEGER NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'SUBMITTED',
    "category" "CategoryCode" NOT NULL,
    "sex" "Sex" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "category" "CategoryCode" NOT NULL,
    "sex" "Sex" NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_userId_key" ON "Athlete"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_slug_key" ON "Athlete"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Season_vintage_key" ON "Season"("vintage");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_seasonId_slug_key" ON "Theme"("seasonId", "slug");

-- CreateIndex
CREATE INDEX "Entry_athleteId_isoYear_isoWeek_environment_idx" ON "Entry"("athleteId", "isoYear", "isoWeek", "environment");

-- CreateIndex
CREATE INDEX "Entry_themeId_category_sex_idx" ON "Entry"("themeId", "category", "sex");

-- CreateIndex
CREATE UNIQUE INDEX "Board_themeId_category_sex_key" ON "Board"("themeId", "category", "sex");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_entryId_key" ON "Placement"("entryId");

-- CreateIndex
CREATE INDEX "Placement_athleteId_idx" ON "Placement"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "Placement_boardId_place_key" ON "Placement"("boardId", "place");

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
