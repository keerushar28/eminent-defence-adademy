-- Add isSettled flag to CategoryPayment
ALTER TABLE "CategoryPayment" ADD COLUMN "isSettled" BOOLEAN NOT NULL DEFAULT false;

-- Add isSettled flag to IssuancePayment
ALTER TABLE "IssuancePayment" ADD COLUMN "isSettled" BOOLEAN NOT NULL DEFAULT false;

-- Add isSettled flag to HostelPayment
ALTER TABLE "HostelPayment" ADD COLUMN "isSettled" BOOLEAN NOT NULL DEFAULT false;
