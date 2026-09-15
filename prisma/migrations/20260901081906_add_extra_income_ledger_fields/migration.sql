-- Add payer fields to LedgerEntry for manual / extra income where the payer may be an insider or outsider
ALTER TABLE "LedgerEntry" ADD COLUMN "payerName" TEXT;
ALTER TABLE "LedgerEntry" ADD COLUMN "payerType" TEXT;
ALTER TABLE "LedgerEntry" ADD COLUMN "payerContact" TEXT;
