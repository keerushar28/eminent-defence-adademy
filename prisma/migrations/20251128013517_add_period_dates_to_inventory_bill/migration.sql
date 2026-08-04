/*
  Warnings:

  - Added the required column `periodEndDate` to the `InventoryBill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStartDate` to the `InventoryBill` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryBill" ADD COLUMN     "periodEndDate" DATE NOT NULL,
ADD COLUMN     "periodStartDate" DATE NOT NULL,
ALTER COLUMN "billDate" DROP DEFAULT,
ALTER COLUMN "billDate" SET DATA TYPE DATE;
