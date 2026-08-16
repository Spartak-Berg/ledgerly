import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto, ReversePaymentDto } from './dto/payment.dto';
import { paymentBalance } from './payment-balance';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const text = (value?: string | null) => value?.trim() || null;
const paymentInclude = {
  recordedBy: { select: { id: true, fullName: true } },
  reversedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, invoiceId: string) {
    await this.invoice(companyId, invoiceId);
    return this.prisma.payment.findMany({
      where: { companyId, invoiceId },
      include: paymentInclude,
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async record(
    companyId: string,
    invoiceId: string,
    userId: string,
    dto: RecordPaymentDto,
  ) {
    const recordedOn = date(dto.paymentDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (recordedOn > today) {
      throw new BadRequestException('Payment date cannot be in the future');
    }
    return this.prisma.$transaction(async (transaction) => {
      await this.lockInvoice(transaction, companyId, invoiceId);
      const invoice = await transaction.invoice.findFirst({
        where: { id: invoiceId, companyId, archivedAt: null },
        include: { payments: { where: { reversedAt: null } } },
      });
      if (!invoice) throw new NotFoundException('Invoice was not found');
      if (
        invoice.status === InvoiceStatus.DRAFT ||
        invoice.status === InvoiceStatus.VOID
      ) {
        throw new ConflictException(
          'Payments require an active issued invoice',
        );
      }
      const amountPaidMinor = invoice.payments.reduce(
        (sum, payment) => sum + payment.amountMinor,
        0,
      );
      const remainingMinor = invoice.totalMinor - amountPaidMinor;
      if (dto.amountMinor > remainingMinor) {
        throw new BadRequestException(
          `Payment exceeds the remaining balance of ${remainingMinor} minor units`,
        );
      }
      const payment = await transaction.payment.create({
        data: {
          companyId,
          invoiceId,
          recordedById: userId,
          amountMinor: dto.amountMinor,
          paymentDate: recordedOn,
          method: dto.method,
          reference: text(dto.reference),
          note: text(dto.note),
        },
        include: paymentInclude,
      });
      const balance = paymentBalance(
        invoice.totalMinor,
        amountPaidMinor + dto.amountMinor,
        Boolean(invoice.sentAt),
      );
      await transaction.invoice.update({
        where: { id: invoiceId },
        data: { status: balance.status, version: { increment: 1 } },
      });
      return { payment, balance };
    });
  }

  async reverse(
    companyId: string,
    invoiceId: string,
    paymentId: string,
    userId: string,
    dto: ReversePaymentDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockInvoice(transaction, companyId, invoiceId);
      const invoice = await transaction.invoice.findFirst({
        where: { id: invoiceId, companyId, archivedAt: null },
      });
      if (!invoice) throw new NotFoundException('Invoice was not found');
      const result = await transaction.payment.updateMany({
        where: {
          id: paymentId,
          invoiceId,
          companyId,
          reversedAt: null,
        },
        data: {
          reversedAt: new Date(),
          reversedById: userId,
          reversalReason: dto.reason.trim(),
        },
      });
      if (result.count !== 1) {
        const existing = await transaction.payment.findFirst({
          where: { id: paymentId, invoiceId, companyId },
          select: { reversedAt: true },
        });
        if (!existing) throw new NotFoundException('Payment was not found');
        throw new ConflictException('Payment has already been reversed');
      }
      const aggregate = await transaction.payment.aggregate({
        where: { invoiceId, companyId, reversedAt: null },
        _sum: { amountMinor: true },
      });
      const balance = paymentBalance(
        invoice.totalMinor,
        aggregate._sum.amountMinor ?? 0,
        Boolean(invoice.sentAt),
      );
      await transaction.invoice.update({
        where: { id: invoiceId },
        data: { status: balance.status, version: { increment: 1 } },
      });
      const payment = await transaction.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: paymentInclude,
      });
      return { payment, balance };
    });
  }

  private async invoice(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId, archivedAt: null },
      select: { id: true },
    });
    if (!invoice) throw new NotFoundException('Invoice was not found');
    return invoice;
  }

  private async lockInvoice(
    transaction: Prisma.TransactionClient,
    companyId: string,
    invoiceId: string,
  ) {
    const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "invoices"
      WHERE "id" = CAST(${invoiceId} AS UUID)
        AND "companyId" = CAST(${companyId} AS UUID)
        AND "archivedAt" IS NULL
      FOR UPDATE
    `);
    if (rows.length !== 1) throw new NotFoundException('Invoice was not found');
  }
}
