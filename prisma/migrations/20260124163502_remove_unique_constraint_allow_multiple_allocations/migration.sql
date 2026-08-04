/*
  Warnings:

  - You are about to drop the column `isSettled` on the `CategoryPayment` table. All the data in the column will be lost.
  - You are about to drop the column `isSettled` on the `HostelPayment` table. All the data in the column will be lost.
  - You are about to drop the column `isSettled` on the `IssuancePayment` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Settlement` table. All the data in the column will be lost.
  - You are about to drop the column `settlementType` on the `Settlement` table. All the data in the column will be lost.
  - Added the required column `billingTitle` to the `InventoryBill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordedBy` to the `Settlement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropIndex
DROP INDEX "public"."Settlement_settlementType_idx";

-- DropIndex
DROP INDEX "public"."StudentCategory_studentId_subCategoryId_key";

-- AlterTable
ALTER TABLE "CategoryPayment" DROP COLUMN "isSettled",
ADD COLUMN     "settlementId" TEXT;

-- AlterTable
ALTER TABLE "HostelPayment" DROP COLUMN "isSettled",
ADD COLUMN     "settlementId" TEXT;

-- AlterTable
ALTER TABLE "InventoryBill" ADD COLUMN     "billingTitle" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "IssuancePayment" DROP COLUMN "isSettled",
ADD COLUMN     "settlementId" TEXT;

-- AlterTable
ALTER TABLE "Settlement" DROP COLUMN "createdBy",
DROP COLUMN "settlementType",
ADD COLUMN     "recordedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "guardianName" TEXT,
ALTER COLUMN "student_image" SET DEFAULT '/uploads/default.jpg';

-- AlterTable
ALTER TABLE "StudentCategory" ADD COLUMN     "notes" TEXT;

-- DropEnum
DROP TYPE "public"."SettlementType";

-- CreateTable
CREATE TABLE "StudentDeletionRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedByRole" "Role" NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentDeletionRequest_studentId_idx" ON "StudentDeletionRequest"("studentId");

-- CreateIndex
CREATE INDEX "StudentDeletionRequest_status_idx" ON "StudentDeletionRequest"("status");

-- CreateIndex
CREATE INDEX "StudentDeletionRequest_createdAt_idx" ON "StudentDeletionRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CategoryPayment_settlementId_idx" ON "CategoryPayment"("settlementId");

-- CreateIndex
CREATE INDEX "HostelPayment_settlementId_idx" ON "HostelPayment"("settlementId");

-- CreateIndex
CREATE INDEX "IssuancePayment_settlementId_idx" ON "IssuancePayment"("settlementId");

-- CreateIndex
CREATE INDEX "Settlement_recordedBy_idx" ON "Settlement"("recordedBy");

-- CreateIndex
CREATE INDEX "StudentCategory_studentId_idx" ON "StudentCategory"("studentId");

-- CreateIndex
CREATE INDEX "StudentCategory_subCategoryId_idx" ON "StudentCategory"("subCategoryId");

-- CreateIndex
CREATE INDEX "StudentCategory_isActive_idx" ON "StudentCategory"("isActive");

-- AddForeignKey
ALTER TABLE "CategoryPayment" ADD CONSTRAINT "CategoryPayment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuancePayment" ADD CONSTRAINT "IssuancePayment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelPayment" ADD CONSTRAINT "HostelPayment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
