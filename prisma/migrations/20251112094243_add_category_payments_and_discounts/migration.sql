/*
  Warnings:

  - Added the required column `finalFee` to the `StudentCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."StudentCategory" DROP CONSTRAINT "StudentCategory_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudentCategory" DROP CONSTRAINT "StudentCategory_subCategoryId_fkey";

-- AlterTable
ALTER TABLE "StudentCategory" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "finalFee" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalPaid" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CategoryPayment" (
    "id" TEXT NOT NULL,
    "studentCategoryId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudentCategory" ADD CONSTRAINT "StudentCategory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCategory" ADD CONSTRAINT "StudentCategory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryPayment" ADD CONSTRAINT "CategoryPayment_studentCategoryId_fkey" FOREIGN KEY ("studentCategoryId") REFERENCES "StudentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
