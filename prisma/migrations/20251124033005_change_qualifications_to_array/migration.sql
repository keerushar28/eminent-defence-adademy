/*
  Warnings:

  - The `qualifications` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'ALLOCATED', 'INACTIVE');

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "qualifications",
ADD COLUMN     "qualifications" TEXT[];

-- AlterTable
ALTER TABLE "StudentCategory" ADD COLUMN     "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "durationMonths" INTEGER;

-- CreateTable
CREATE TABLE "HostelRoom" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelBed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "pricePerDay" DECIMAL(10,2) NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAllocation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "allocationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deallocationDate" TIMESTAMP(3),
    "paidUntil" TIMESTAMP(3) NOT NULL,
    "creditBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostelAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelPayment" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daysPurchased" INTEGER NOT NULL,
    "updatedPaidUntil" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostelRoom_roomNumber_key" ON "HostelRoom"("roomNumber");

-- CreateIndex
CREATE INDEX "HostelRoom_roomNumber_idx" ON "HostelRoom"("roomNumber");

-- CreateIndex
CREATE INDEX "HostelBed_roomId_idx" ON "HostelBed"("roomId");

-- CreateIndex
CREATE INDEX "HostelBed_status_idx" ON "HostelBed"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBed_roomId_bedNumber_key" ON "HostelBed"("roomId", "bedNumber");

-- CreateIndex
CREATE INDEX "HostelAllocation_studentId_idx" ON "HostelAllocation"("studentId");

-- CreateIndex
CREATE INDEX "HostelAllocation_bedId_idx" ON "HostelAllocation"("bedId");

-- CreateIndex
CREATE INDEX "HostelAllocation_isActive_idx" ON "HostelAllocation"("isActive");

-- CreateIndex
CREATE INDEX "HostelAllocation_allocationDate_idx" ON "HostelAllocation"("allocationDate");

-- CreateIndex
CREATE INDEX "HostelPayment_allocationId_idx" ON "HostelPayment"("allocationId");

-- CreateIndex
CREATE INDEX "HostelPayment_paymentDate_idx" ON "HostelPayment"("paymentDate");

-- AddForeignKey
ALTER TABLE "HostelBed" ADD CONSTRAINT "HostelBed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HostelBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelPayment" ADD CONSTRAINT "HostelPayment_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "HostelAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
