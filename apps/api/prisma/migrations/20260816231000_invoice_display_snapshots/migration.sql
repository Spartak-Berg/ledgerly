ALTER TABLE "invoices"
ADD COLUMN "customerSnapshot" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "companySnapshot" JSONB NOT NULL DEFAULT '{}';
