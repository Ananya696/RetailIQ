/*
  Warnings:

  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `cost` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `salePrice` on the `Sale` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[employeeCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'OTHER');

-- AlterTable
ALTER TABLE "Prediction" ADD COLUMN     "storeId" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supplier" TEXT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "cost" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "anomalyReason" TEXT,
ADD COLUMN     "anomalyScore" DOUBLE PRECISION,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ALTER COLUMN "salePrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employeeCode" TEXT,
ADD COLUMN     "inviteExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AIReport_generatedBy_idx" ON "AIReport"("generatedBy");

-- CreateIndex
CREATE INDEX "Prediction_productId_forDate_idx" ON "Prediction"("productId", "forDate");

-- CreateIndex
CREATE INDEX "Sale_productId_saleDate_idx" ON "Sale"("productId", "saleDate");

-- CreateIndex
CREATE INDEX "Sale_soldById_saleDate_idx" ON "Sale"("soldById", "saleDate");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- AddForeignKey
ALTER TABLE "AIReport" ADD CONSTRAINT "AIReport_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
