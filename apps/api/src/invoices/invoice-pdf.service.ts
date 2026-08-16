import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { jsPDF } from 'jspdf';

export interface InvoiceDocumentData {
  id: string;
  number: string | null;
  issueDate: Date;
  dueDate: Date;
  issuedAt: Date | null;
  createdAt: Date;
  currency: string;
  notes: string | null;
  paymentTerms: string | null;
  reference: string | null;
  companyNameSnapshot: string;
  customerNameSnapshot: string;
  companySnapshot: Prisma.JsonValue;
  customerSnapshot: Prisma.JsonValue;
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
  items: Array<{
    description: string;
    quantity: Prisma.Decimal;
    unit: string;
    unitPriceMinor: number;
    vatRate: Prisma.Decimal;
    totalMinor: number;
  }>;
}

const record = (value: Prisma.JsonValue): Prisma.JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const field = (value: Prisma.JsonObject, key: string) =>
  typeof value[key] === 'string' ? value[key] : '';
const date = (value: Date) => value.toISOString().slice(0, 10);
const filename = (value: string) =>
  value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'invoice';
const amount = (minor: number, currency: string) =>
  `${currency} ${new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(minor / 100)
    .replaceAll('\u00a0', ' ')}`;

@Injectable()
export class InvoicePdfService {
  render(invoice: InvoiceDocumentData) {
    const number = invoice.number ?? 'invoice';
    const company = record(invoice.companySnapshot);
    const customer = record(invoice.customerSnapshot);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    pdf.setProperties({
      title: `Invoice ${number}`,
      subject: `Invoice from ${invoice.companyNameSnapshot}`,
      author: invoice.companyNameSnapshot,
      creator: 'Ledgerly',
    });
    pdf.setCreationDate(invoice.issuedAt ?? invoice.createdAt);
    pdf.setFileId(
      createHash('sha256')
        .update(`${invoice.id}:${number}`)
        .digest('hex')
        .slice(0, 32),
    );

    const blue = '#356fe5';
    const muted = '#667085';
    const left = 18;
    const right = 192;
    const pageHeader = () => {
      pdf.setTextColor(blue);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(invoice.companyNameSnapshot, left, 24);
      pdf.setTextColor('#111827');
      pdf.setFontSize(24);
      pdf.text('INVOICE', right, 24, { align: 'right' });
      pdf.setFontSize(11);
      pdf.text(number, right, 32, { align: 'right' });
    };
    pageHeader();

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(muted);
    pdf.setFontSize(8);
    pdf.text('FROM', left, 48);
    pdf.text('BILL TO', 110, 48);
    pdf.setTextColor('#111827');
    pdf.setFontSize(10);
    const companyLines = [
      invoice.companyNameSnapshot,
      field(company, 'addressLine1'),
      [field(company, 'postalCode'), field(company, 'city')]
        .filter(Boolean)
        .join(' '),
      field(company, 'organisationNumber')
        ? `Org. no. ${field(company, 'organisationNumber')}`
        : '',
      field(company, 'vatNumber') ? `VAT ${field(company, 'vatNumber')}` : '',
    ].filter((value): value is string => Boolean(value));
    const customerLines = [
      invoice.customerNameSnapshot,
      field(customer, 'contactName'),
      field(customer, 'billingAddressLine1'),
      [field(customer, 'billingPostalCode'), field(customer, 'billingCity')]
        .filter(Boolean)
        .join(' '),
      field(customer, 'organisationNumber')
        ? `Org. no. ${field(customer, 'organisationNumber')}`
        : '',
    ].filter(Boolean);
    pdf.text(companyLines, left, 55);
    pdf.text(customerLines, 110, 55);

    pdf.setTextColor(muted);
    pdf.setFontSize(8);
    pdf.text('ISSUE DATE', left, 87);
    pdf.text('DUE DATE', 60, 87);
    pdf.text('REFERENCE', 102, 87);
    pdf.text('CURRENCY', 160, 87);
    pdf.setTextColor('#111827');
    pdf.setFontSize(9);
    pdf.text(date(invoice.issueDate), left, 93);
    pdf.text(date(invoice.dueDate), 60, 93);
    pdf.text(invoice.reference || '-', 102, 93);
    pdf.text(invoice.currency, 160, 93);

    const tableHeader = (y: number) => {
      pdf.setFillColor('#f2f5fa');
      pdf.rect(left, y, right - left, 9, 'F');
      pdf.setTextColor(muted);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DESCRIPTION', left + 2, y + 6);
      pdf.text('QTY / UNIT', 112, y + 6);
      pdf.text('VAT', 147, y + 6, { align: 'right' });
      pdf.text('TOTAL', right - 2, y + 6, { align: 'right' });
      return y + 15;
    };
    let y = tableHeader(103);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#111827');
    for (const item of invoice.items) {
      if (y > 252) {
        pdf.addPage();
        pageHeader();
        y = tableHeader(40);
      }
      const description = pdf.splitTextToSize(item.description, 82) as string[];
      pdf.setFontSize(9);
      pdf.text(description, left + 2, y);
      pdf.text(`${Number(item.quantity)} ${item.unit}`, 112, y);
      pdf.text(`${Number(item.vatRate)}%`, 147, y, { align: 'right' });
      pdf.text(amount(item.totalMinor, invoice.currency), right - 2, y, {
        align: 'right',
      });
      y += Math.max(10, description.length * 4.5 + 3);
      pdf.setDrawColor('#e5e7eb');
      pdf.line(left, y - 3, right, y - 3);
    }
    if (y > 228) {
      pdf.addPage();
      pageHeader();
      y = 48;
    }
    const totalsLeft = 124;
    pdf.setFontSize(9);
    pdf.text('Subtotal', totalsLeft, y + 7);
    pdf.text(amount(invoice.subtotalMinor, invoice.currency), right, y + 7, {
      align: 'right',
    });
    pdf.text('VAT', totalsLeft, y + 15);
    pdf.text(amount(invoice.vatMinor, invoice.currency), right, y + 15, {
      align: 'right',
    });
    pdf.setDrawColor(blue);
    pdf.line(totalsLeft, y + 20, right, y + 20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('TOTAL', totalsLeft, y + 29);
    pdf.text(amount(invoice.totalMinor, invoice.currency), right, y + 29, {
      align: 'right',
    });

    const footerY = Math.min(278, y + 55);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(muted);
    const payment = [
      invoice.paymentTerms,
      field(company, 'bankAccount')
        ? `Bank account: ${field(company, 'bankAccount')}`
        : '',
      field(company, 'iban') ? `IBAN: ${field(company, 'iban')}` : '',
      invoice.notes,
    ].filter((value): value is string => Boolean(value));
    pdf.text(
      payment.length ? payment : ['Thank you for your business.'],
      left,
      footerY,
    );

    return {
      buffer: Buffer.from(pdf.output('arraybuffer')),
      filename: `${filename(number)}.pdf`,
    };
  }
}
