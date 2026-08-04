-- Add createdAt to StudentIssuance
ALTER TABLE "StudentIssuance" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create LedgerEntry table
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "referenceNumber" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for LedgerEntry
CREATE INDEX "LedgerEntry_type_idx" ON "LedgerEntry"("type");
CREATE INDEX "LedgerEntry_category_idx" ON "LedgerEntry"("category");
CREATE INDEX "LedgerEntry_recordedDate_idx" ON "LedgerEntry"("recordedDate");
CREATE INDEX "LedgerEntry_referenceId_idx" ON "LedgerEntry"("referenceId");
