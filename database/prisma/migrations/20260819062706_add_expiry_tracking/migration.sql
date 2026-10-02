-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isPerishable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shelfLifeDays" INTEGER;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "expiryDate" TIMESTAMP(3);
