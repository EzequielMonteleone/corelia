-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "ClaimDraftKind" AS ENUM ('CREATE', 'RESOLVE');

-- CreateEnum
CREATE TYPE "ClaimDraftStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'OPEN',
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimDraft" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ClaimDraftKind" NOT NULL,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT,
    "claimId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "nextStatus" "ClaimStatus",
    "reply" TEXT,
    "replyProvided" BOOLEAN NOT NULL DEFAULT false,
    "unitName" TEXT NOT NULL,
    "buildingName" TEXT NOT NULL,
    "status" "ClaimDraftStatus" NOT NULL DEFAULT 'PENDING',
    "resultClaimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Claim_buildingId_createdAt_idx" ON "Claim"("buildingId", "createdAt");

-- CreateIndex
CREATE INDEX "Claim_unitId_createdAt_idx" ON "Claim"("unitId", "createdAt");

-- CreateIndex
CREATE INDEX "ClaimDraft_threadId_status_idx" ON "ClaimDraft"("threadId", "status");

-- CreateIndex
CREATE INDEX "ClaimDraft_userId_idx" ON "ClaimDraft"("userId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_repliedByUserId_fkey" FOREIGN KEY ("repliedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDraft" ADD CONSTRAINT "ClaimDraft_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDraft" ADD CONSTRAINT "ClaimDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
