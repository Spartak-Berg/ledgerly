CREATE TYPE "ProductType" AS ENUM ('PRODUCT', 'SERVICE');
CREATE TABLE "products" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sku" TEXT,
  "type" "ProductType" NOT NULL DEFAULT 'SERVICE',
  "unit" TEXT NOT NULL DEFAULT 'hour',
  "defaultQuantity" DECIMAL(12,4) NOT NULL DEFAULT 1,
  "unitPriceMinor" INTEGER NOT NULL,
  "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 25,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'NOK',
  "category" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "products_companyId_sku_key" ON "products"("companyId", "sku");
CREATE INDEX "products_companyId_active_name_idx" ON "products"("companyId", "active", "name");
ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
