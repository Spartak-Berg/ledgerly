ALTER TABLE "users" ADD COLUMN "selectedCompanyId" UUID;

ALTER TABLE "companies"
  ADD COLUMN "organisationNumber" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "countryCode" VARCHAR(2) NOT NULL DEFAULT 'NO',
  ADD COLUMN "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "vatNumber" TEXT,
  ADD COLUMN "bankAccount" TEXT,
  ADD COLUMN "iban" TEXT,
  ADD COLUMN "bic" TEXT;

ALTER TABLE "company_settings"
  ADD COLUMN "financialYearStartMonth" INTEGER NOT NULL DEFAULT 1;

-- Nullable only while legacy prototype customers await the full customer migration.
-- All application queries require an authenticated companyId.
ALTER TABLE "customers" ADD COLUMN "companyId" UUID;

UPDATE "users" AS u
SET "selectedCompanyId" = (
  SELECT cm."companyId"
  FROM "company_members" AS cm
  WHERE cm."userId" = u."id"
  ORDER BY cm."createdAt" ASC
  LIMIT 1
);

CREATE INDEX "customers_companyId_companyName_idx" ON "customers"("companyId", "companyName");
ALTER TABLE "users" ADD CONSTRAINT "users_selectedCompanyId_fkey" FOREIGN KEY ("selectedCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
