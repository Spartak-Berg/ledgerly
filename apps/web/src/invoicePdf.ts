import type { Customer, LineItem } from './lib';
import { invoiceTotals } from './lib';

export interface InvoicePdfData {
  customer: Customer;
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  terms: string;
  items: LineItem[];
}

const safeFilename = (value: string) =>
  value.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'invoice';

export async function downloadInvoicePdf(invoice: InvoicePdfData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const totals = invoiceTotals(invoice.items);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const right = pageWidth - 18;
  const amount = (value: number) =>
    new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: invoice.currency,
      minimumFractionDigits: 2,
    }).format(value).replace(/\u00a0/g, ' ');

  pdf.setFillColor(53, 111, 229);
  pdf.roundedRect(18, 16, 12, 12, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('L', 24, 24, { align: 'center' });
  pdf.setTextColor(24, 32, 47);
  pdf.setFontSize(13);
  pdf.text('Ledgerly', 34, 24);
  pdf.setFontSize(25);
  pdf.text('INVOICE', right, 23, { align: 'right' });
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.number, right, 29, { align: 'right' });

  pdf.setTextColor(104, 115, 134);
  pdf.setFontSize(8);
  pdf.text('FROM', 18, 45);
  pdf.text('BILL TO', 110, 45);
  pdf.setTextColor(24, 32, 47);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Nordic Studio AS', 18, 52);
  pdf.text(invoice.customer.company, 110, 52);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text('Storgata 18, 0155 Oslo', 18, 58);
  pdf.text('Org. no. 923 456 781', 18, 63);
  const customerDetails = [
    invoice.customer.contact,
    invoice.customer.email,
    invoice.customer.phone,
  ].filter(Boolean);
  customerDetails.forEach((line, index) => pdf.text(line, 110, 58 + index * 5));

  pdf.setFontSize(8);
  pdf.setTextColor(104, 115, 134);
  pdf.text('ISSUE DATE', 18, 80);
  pdf.text('DUE DATE', 62, 80);
  pdf.text('CURRENCY', 106, 80);
  pdf.setTextColor(24, 32, 47);
  pdf.setFontSize(9);
  pdf.text(invoice.issueDate, 18, 86);
  pdf.text(invoice.dueDate, 62, 86);
  pdf.text(invoice.currency, 106, 86);

  let y = 99;
  const drawTableHeader = () => {
    pdf.setFillColor(246, 248, 251);
    pdf.rect(18, y - 5, pageWidth - 36, 9, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(104, 115, 134);
    pdf.text('DESCRIPTION', 21, y);
    pdf.text('QTY', 122, y, { align: 'right' });
    pdf.text('UNIT PRICE', 156, y, { align: 'right' });
    pdf.text('VAT', 171, y, { align: 'right' });
    pdf.text('TOTAL', right, y, { align: 'right' });
    y += 10;
  };
  drawTableHeader();

  invoice.items.forEach((item) => {
    if (y > 245) {
      pdf.addPage();
      y = 22;
      drawTableHeader();
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(24, 32, 47);
    const description = pdf.splitTextToSize(item.description, 82) as string[];
    pdf.text(description, 21, y);
    pdf.text(String(item.quantity), 122, y, { align: 'right' });
    pdf.text(amount(item.unitPrice), 156, y, { align: 'right' });
    pdf.text(`${item.vatRate}%`, 171, y, { align: 'right' });
    pdf.text(amount(item.quantity * item.unitPrice), right, y, { align: 'right' });
    y += Math.max(9, description.length * 4.5 + 3);
    pdf.setDrawColor(233, 236, 241);
    pdf.line(18, y - 4, right, y - 4);
  });

  if (y > 225) {
    pdf.addPage();
    y = 25;
  }
  y += 4;
  const labelX = 143;
  pdf.setFontSize(9);
  pdf.text('Subtotal', labelX, y);
  pdf.text(amount(totals.subtotal), right, y, { align: 'right' });
  y += 7;
  pdf.text('VAT', labelX, y);
  pdf.text(amount(totals.vat), right, y, { align: 'right' });
  y += 8;
  pdf.setDrawColor(180, 187, 198);
  pdf.line(labelX, y - 5, right, y - 5);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Total', labelX, y);
  pdf.text(amount(totals.total), right, y, { align: 'right' });

  y += 18;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('NOTES', 18, y);
  pdf.text('PAYMENT TERMS', 110, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(70, 80, 96);
  pdf.text(pdf.splitTextToSize(invoice.notes || '—', 78), 18, y + 6);
  pdf.text(pdf.splitTextToSize(invoice.terms || '—', 78), 110, y + 6);

  pdf.save(`${safeFilename(invoice.number)}.pdf`);
}
