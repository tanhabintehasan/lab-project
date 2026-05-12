-- CreateTable
CREATE TABLE "TestingServiceCustomField" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestingServiceCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestingServiceCustomField_serviceId_idx" ON "TestingServiceCustomField"("serviceId");

-- AddForeignKey
ALTER TABLE "TestingServiceCustomField" ADD CONSTRAINT "TestingServiceCustomField_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AlterTable
ALTER TABLE "Sample" ADD COLUMN "customFieldValues" JSONB;
