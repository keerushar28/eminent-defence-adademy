-- AlterTable
ALTER TABLE "InventoryCategory" ADD COLUMN     "isBilling" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "InventoryBill" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "units" DECIMAL(10,2),
    "billDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventoryBill" ADD CONSTRAINT "InventoryBill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
