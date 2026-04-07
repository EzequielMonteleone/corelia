-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('SUPERADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UnitRelationType" AS ENUM ('OWNER', 'ROOMER');

-- AlterTable: add globalRole to User
ALTER TABLE "User" ADD COLUMN "globalRole" "GlobalRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingAmenity" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUnit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "relationType" "UnitRelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_key_key" ON "Amenity"("key");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingAmenity_buildingId_amenityId_key" ON "BuildingAmenity"("buildingId", "amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_buildingId_name_key" ON "Unit"("buildingId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserUnit_userId_unitId_relationType_key" ON "UserUnit"("userId", "unitId", "relationType");

-- AddForeignKey
ALTER TABLE "BuildingAmenity" ADD CONSTRAINT "BuildingAmenity_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingAmenity" ADD CONSTRAINT "BuildingAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUnit" ADD CONSTRAINT "UserUnit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUnit" ADD CONSTRAINT "UserUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
