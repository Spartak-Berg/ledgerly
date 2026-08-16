CREATE TYPE "CustomerType" AS ENUM ('COMPANY', 'INDIVIDUAL');

INSERT INTO "companies" ("id", "name", "slug", "updatedAt")
SELECT '00000000-0000-4000-8000-000000000001', 'Ledgerly Legacy Prototype Data', 'ledgerly-legacy-prototype-data', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "customers" WHERE "companyId" IS NULL)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "company_settings" ("companyId", "updatedAt")
SELECT "id", CURRENT_TIMESTAMP FROM "companies" WHERE "slug" = 'ledgerly-legacy-prototype-data'
ON CONFLICT ("companyId") DO NOTHING;

UPDATE "customers" SET "companyId" = (SELECT "id" FROM "companies" WHERE "slug" = 'ledgerly-legacy-prototype-data') WHERE "companyId" IS NULL;

ALTER TABLE "customers"
  ALTER COLUMN "companyId" SET NOT NULL,
  ADD COLUMN "type" "CustomerType" NOT NULL DEFAULT 'COMPANY',
  ADD COLUMN "organisationNumber" TEXT,
  ADD COLUMN "billingAddressLine1" TEXT,
  ADD COLUMN "billingAddressLine2" TEXT,
  ADD COLUMN "billingPostalCode" TEXT,
  ADD COLUMN "billingCity" TEXT,
  ADD COLUMN "postalAddressLine1" TEXT,
  ADD COLUMN "postalAddressLine2" TEXT,
  ADD COLUMN "postalPostalCode" TEXT,
  ADD COLUMN "postalCity" TEXT,
  ADD COLUMN "countryCode" VARCHAR(2) NOT NULL DEFAULT 'NO',
  ADD COLUMN "vatNumber" TEXT,
  ADD COLUMN "defaultCurrency" VARCHAR(3) NOT NULL DEFAULT 'NOK',
  ADD COLUMN "defaultPaymentDays" INTEGER NOT NULL DEFAULT 14,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3);
