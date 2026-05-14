-- Equipment Module Enhancement
-- Adds calibration tracking, equipment media, and equipment-service links

-- Add calibration columns to Equipment
ALTER TABLE "Equipment"
  ADD COLUMN IF NOT EXISTS "lastCalibratedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextCalibrationDue" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "calibrationCertificateUrl" VARCHAR(500);

-- Create EquipmentMedia table
CREATE TABLE IF NOT EXISTS "EquipmentMedia" (
  "id" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EquipmentMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EquipmentMedia_equipmentId_idx" ON "EquipmentMedia"("equipmentId");

-- Add foreign key for EquipmentMedia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'EquipmentMedia_equipmentId_fkey'
  ) THEN
    ALTER TABLE "EquipmentMedia"
      ADD CONSTRAINT "EquipmentMedia_equipmentId_fkey"
      FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- Create EquipmentService junction table
CREATE TABLE IF NOT EXISTS "EquipmentService" (
  "id" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,

  CONSTRAINT "EquipmentService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EquipmentService_equipmentId_serviceId_key" UNIQUE ("equipmentId", "serviceId")
);

CREATE INDEX IF NOT EXISTS "EquipmentService_equipmentId_idx" ON "EquipmentService"("equipmentId");
CREATE INDEX IF NOT EXISTS "EquipmentService_serviceId_idx" ON "EquipmentService"("serviceId");

-- Add foreign keys for EquipmentService
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'EquipmentService_equipmentId_fkey'
  ) THEN
    ALTER TABLE "EquipmentService"
      ADD CONSTRAINT "EquipmentService_equipmentId_fkey"
      FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'EquipmentService_serviceId_fkey'
  ) THEN
    ALTER TABLE "EquipmentService"
      ADD CONSTRAINT "EquipmentService_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;
