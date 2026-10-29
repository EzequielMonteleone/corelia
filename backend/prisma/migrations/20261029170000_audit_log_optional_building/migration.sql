-- A superadmin can change their own password without a building.
ALTER TABLE "AuditLog" ALTER COLUMN "buildingId" DROP NOT NULL;
