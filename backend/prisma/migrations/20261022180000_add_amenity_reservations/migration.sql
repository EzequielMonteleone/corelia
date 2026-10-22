-- AlterTable
ALTER TABLE "BuildingAmenity" ADD COLUMN "slotMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN "maxConcurrent" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "openTime" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN "closeTime" TEXT NOT NULL DEFAULT '22:00',
ADD COLUMN "rules" TEXT;

-- CreateEnum
CREATE TYPE "AmenityReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "AmenityReservation" (
    "id" TEXT NOT NULL,
    "buildingAmenityId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AmenityReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmenityReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AmenityReservation_buildingAmenityId_startsAt_idx" ON "AmenityReservation"("buildingAmenityId", "startsAt");

-- CreateIndex
CREATE INDEX "AmenityReservation_unitId_startsAt_idx" ON "AmenityReservation"("unitId", "startsAt");

-- CreateIndex
CREATE INDEX "AmenityReservation_userId_idx" ON "AmenityReservation"("userId");

-- AddForeignKey
ALTER TABLE "AmenityReservation" ADD CONSTRAINT "AmenityReservation_buildingAmenityId_fkey" FOREIGN KEY ("buildingAmenityId") REFERENCES "BuildingAmenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmenityReservation" ADD CONSTRAINT "AmenityReservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmenityReservation" ADD CONSTRAINT "AmenityReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
