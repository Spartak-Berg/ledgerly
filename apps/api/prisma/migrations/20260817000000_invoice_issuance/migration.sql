ALTER TYPE "InvoiceStatus" ADD VALUE 'ISSUED' BEFORE 'SENT';

ALTER TABLE "company_settings"
ADD COLUMN "invoicePrefix" VARCHAR(10) NOT NULL DEFAULT 'INV',
ADD COLUMN "invoiceNumberPadding" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "invoices"
ADD COLUMN "issuedAt" TIMESTAMP(3),
ADD COLUMN "sentAt" TIMESTAMP(3),
ADD COLUMN "voidedAt" TIMESTAMP(3),
ADD COLUMN "voidReason" TEXT;

ALTER TABLE "company_settings"
ADD CONSTRAINT "company_settings_invoiceNumberPadding_check" CHECK ("invoiceNumberPadding" BETWEEN 3 AND 10),
ADD CONSTRAINT "company_settings_nextInvoiceNumber_check" CHECK ("nextInvoiceNumber" > 0);
