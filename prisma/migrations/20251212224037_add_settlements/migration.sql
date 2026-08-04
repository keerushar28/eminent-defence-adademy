/*
  Warnings:

  - You are about to drop the column `period` on the `InventoryBill` table. All the data in the column will be lost.
  - The `paymentMethod` column on the `LedgerEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `LedgerEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "SettlementType" AS ENUM ('STAFF_PAYMENT', 'COMPANY_PAYMENT');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HOSTEL_ADMIN';

-- AlterTable
ALTER TABLE "InventoryBill" DROP COLUMN "period";

-- AlterTable
ALTER TABLE "LedgerEntry" DROP COLUMN "type",
ADD COLUMN     "type" "LedgerType" NOT NULL,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "selectedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudentIssuance" ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "IssuancePayment" (
    "id" TEXT NOT NULL,
    "issuanceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuancePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategorySelection" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubCategorySelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settlementType" "SettlementType" NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssuancePayment_issuanceId_idx" ON "IssuancePayment"("issuanceId");

-- CreateIndex
CREATE INDEX "IssuancePayment_paymentDate_idx" ON "IssuancePayment"("paymentDate");

-- CreateIndex
CREATE INDEX "SubCategorySelection_studentId_idx" ON "SubCategorySelection"("studentId");

-- CreateIndex
CREATE INDEX "SubCategorySelection_subCategoryId_idx" ON "SubCategorySelection"("subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategorySelection_studentId_subCategoryId_key" ON "SubCategorySelection"("studentId", "subCategoryId");

-- CreateIndex
CREATE INDEX "Settlement_settlementDate_idx" ON "Settlement"("settlementDate");

-- CreateIndex
CREATE INDEX "Settlement_settlementType_idx" ON "Settlement"("settlementType");

-- CreateIndex
CREATE INDEX "Settlement_createdAt_idx" ON "Settlement"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_type_idx" ON "LedgerEntry"("type");

-- AddForeignKey
ALTER TABLE "IssuancePayment" ADD CONSTRAINT "IssuancePayment_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "StudentIssuance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategorySelection" ADD CONSTRAINT "SubCategorySelection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategorySelection" ADD CONSTRAINT "SubCategorySelection_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
