-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'LEAD', 'ARCHIVED');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_companyName_idx" ON "customers"("companyName");
