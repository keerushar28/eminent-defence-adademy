-- AlterTable
ALTER TABLE "Student" ADD COLUMN "heightUnit" TEXT NOT NULL DEFAULT 'cm',
ADD COLUMN "weightUnit" TEXT NOT NULL DEFAULT 'kg';
