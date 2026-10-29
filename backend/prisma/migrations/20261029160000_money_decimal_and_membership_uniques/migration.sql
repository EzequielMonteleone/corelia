-- Keep one role per name, the oldest id, and point memberships at it.
WITH ranked AS (
  SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
  FROM "Role"
),
keepers AS (
  SELECT id, name FROM ranked WHERE rn = 1
),
dupes AS (
  SELECT ranked.id AS dupe_id, keepers.id AS keep_id
  FROM ranked
  JOIN keepers ON keepers.name = ranked.name
  WHERE ranked.rn > 1
)
UPDATE "BuildingUser" AS membership
SET "roleId" = dupes.keep_id
FROM dupes
WHERE membership."roleId" = dupes.dupe_id;

WITH ranked AS (
  SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
  FROM "Role"
),
keepers AS (
  SELECT id, name FROM ranked WHERE rn = 1
),
dupes AS (
  SELECT ranked.id AS dupe_id, keepers.id AS keep_id
  FROM ranked
  JOIN keepers ON keepers.name = ranked.name
  WHERE ranked.rn > 1
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT dupes.keep_id, permission."permissionId"
FROM "RolePermission" AS permission
JOIN dupes ON permission."roleId" = dupes.dupe_id
ON CONFLICT DO NOTHING;

DELETE FROM "RolePermission" AS permission
WHERE permission."roleId" IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
    FROM "Role"
  ) ranked
  WHERE rn > 1
);

DELETE FROM "Role"
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id) AS rn
    FROM "Role"
  ) ranked
  WHERE rn > 1
);

-- One membership per person and building. Keep Admin, then Owner, then Roomer.
DELETE FROM "BuildingUser"
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      membership.id,
      ROW_NUMBER() OVER (
        PARTITION BY membership."buildingId", membership."userId"
        ORDER BY
          CASE role.name
            WHEN 'Admin' THEN 0
            WHEN 'Owner' THEN 1
            WHEN 'Roomer' THEN 2
            ELSE 3
          END,
          membership."createdAt" ASC
      ) AS rn
    FROM "BuildingUser" AS membership
    JOIN "Role" AS role ON role.id = membership."roleId"
  ) ranked
  WHERE rn > 1
);

ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "BuildingUser_buildingId_userId_key" ON "BuildingUser"("buildingId", "userId");
