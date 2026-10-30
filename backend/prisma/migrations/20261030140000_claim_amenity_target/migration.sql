-- AlterTable
ALTER TABLE "Claim" ALTER COLUMN "unitId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN "buildingAmenityId" TEXT;

-- AlterTable
ALTER TABLE "ClaimDraft" ADD COLUMN "buildingAmenityId" TEXT;
ALTER TABLE "ClaimDraft" ADD COLUMN "amenityName" TEXT;

-- CreateIndex
CREATE INDEX "Claim_buildingAmenityId_idx" ON "Claim"("buildingAmenityId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_buildingAmenityId_fkey" FOREIGN KEY ("buildingAmenityId") REFERENCES "BuildingAmenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A claim is about one unit or one amenity, never both and never neither.
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_target_check" CHECK (
  (CASE WHEN "unitId" IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN "buildingAmenityId" IS NOT NULL THEN 1 ELSE 0 END) = 1
);
