CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD', 'CASH', 'OTHER');

CREATE TABLE "payments" (
  "id" UUID NOT NULL,
  "companyId" UUID NOT NULL,
  "invoiceId" UUID NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "paymentDate" DATE NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "reference" TEXT,
  "note" TEXT,
  "recordedById" UUID NOT NULL,
  "reversedAt" TIMESTAMP(3),
  "reversedById" UUID,
  "reversalReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_amountMinor_check" CHECK ("amountMinor" > 0)
);

CREATE INDEX "payments_companyId_paymentDate_idx" ON "payments"("companyId", "paymentDate");
CREATE INDEX "payments_invoiceId_reversedAt_idx" ON "payments"("invoiceId", "reversedAt");

ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
