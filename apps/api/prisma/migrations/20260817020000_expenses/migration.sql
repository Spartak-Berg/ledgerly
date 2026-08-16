CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED');

CREATE TABLE "suppliers" (
  "id" UUID NOT NULL, "companyId" UUID NOT NULL, "name" TEXT NOT NULL,
  "organisationNumber" TEXT, "email" TEXT, "phone" TEXT, "addressLine1" TEXT,
  "postalCode" TEXT, "city" TEXT, "countryCode" VARCHAR(2) NOT NULL DEFAULT 'NO',
  "notes" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "expense_categories" (
  "id" UUID NOT NULL, "companyId" UUID NOT NULL, "name" TEXT NOT NULL,
  "systemKey" TEXT, "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 25,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "expenses" (
  "id" UUID NOT NULL, "companyId" UUID NOT NULL, "supplierId" UUID,
  "categoryId" UUID NOT NULL, "merchantSnapshot" TEXT NOT NULL, "description" TEXT,
  "expenseDate" DATE NOT NULL, "currency" VARCHAR(3) NOT NULL DEFAULT 'NOK',
  "netMinor" INTEGER NOT NULL, "vatMinor" INTEGER NOT NULL, "totalMinor" INTEGER NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL, "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT, "archivedAt" TIMESTAMP(3), "reviewedAt" TIMESTAMP(3),
  "createdById" UUID NOT NULL, "reviewedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "expenses_netMinor_check" CHECK ("netMinor" >= 0),
  CONSTRAINT "expenses_vatMinor_check" CHECK ("vatMinor" >= 0),
  CONSTRAINT "expenses_totalMinor_check" CHECK ("totalMinor" > 0),
  CONSTRAINT "expenses_amount_invariant_check" CHECK ("netMinor" + "vatMinor" = "totalMinor")
);
CREATE INDEX "suppliers_companyId_active_name_idx" ON "suppliers"("companyId", "active", "name");
CREATE UNIQUE INDEX "expense_categories_companyId_name_key" ON "expense_categories"("companyId", "name");
CREATE UNIQUE INDEX "expense_categories_companyId_systemKey_key" ON "expense_categories"("companyId", "systemKey");
CREATE INDEX "expense_categories_companyId_active_name_idx" ON "expense_categories"("companyId", "active", "name");
CREATE INDEX "expenses_companyId_expenseDate_idx" ON "expenses"("companyId", "expenseDate");
CREATE INDEX "expenses_companyId_status_archivedAt_idx" ON "expenses"("companyId", "status", "archivedAt");
CREATE INDEX "expenses_supplierId_idx" ON "expenses"("supplierId");
CREATE INDEX "expenses_categoryId_idx" ON "expenses"("categoryId");
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "expense_categories" ("id", "companyId", "name", "systemKey", "vatRate", "updatedAt")
SELECT gen_random_uuid(), c."id", defaults.name, defaults.key, defaults.vat, CURRENT_TIMESTAMP
FROM "companies" c
CROSS JOIN (VALUES
  ('Office supplies', 'OFFICE', 25), ('Software', 'SOFTWARE', 25),
  ('Travel', 'TRAVEL', 12), ('Professional services', 'PROFESSIONAL', 25),
  ('Other', 'OTHER', 25)
) AS defaults(name, key, vat);
