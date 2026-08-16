CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

CREATE TABLE "invoices" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "customerId" UUID NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "number" TEXT,
  "issueDate" DATE NOT NULL,
  "dueDate" DATE NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'NOK',
  "reference" TEXT,
  "purchaseOrderReference" TEXT,
  "notes" TEXT,
  "paymentTerms" TEXT,
  "customerNameSnapshot" TEXT NOT NULL,
  "companyNameSnapshot" TEXT NOT NULL,
  "subtotalMinor" INTEGER NOT NULL DEFAULT 0,
  "vatMinor" INTEGER NOT NULL DEFAULT 0,
  "totalMinor" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_items" (
  "id" UUID NOT NULL,
  "invoiceId" UUID NOT NULL,
  "productId" UUID,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(12,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitPriceMinor" INTEGER NOT NULL,
  "vatRate" DECIMAL(5,2) NOT NULL,
  "subtotalMinor" INTEGER NOT NULL,
  "vatMinor" INTEGER NOT NULL,
  "totalMinor" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invoices_companyId_status_issueDate_idx" ON "invoices"("companyId", "status", "issueDate");
CREATE INDEX "invoices_companyId_customerId_idx" ON "invoices"("companyId", "customerId");
CREATE UNIQUE INDEX "invoices_companyId_number_key" ON "invoices"("companyId", "number");
CREATE INDEX "invoice_items_invoiceId_position_idx" ON "invoice_items"("invoiceId", "position");
CREATE INDEX "invoice_items_productId_idx" ON "invoice_items"("productId");

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
