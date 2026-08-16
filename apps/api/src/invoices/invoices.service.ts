import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  InvoiceDraftDto,
  ListInvoicesQueryDto,
  UpdateInvoiceDraftDto,
} from './dto/invoice-draft.dto';
import { calculateInvoice } from './invoice-calculator';
import { IssueInvoiceDto, VoidInvoiceDto } from './dto/invoice-action.dto';
import { InvoicePdfService } from './invoice-pdf.service';
import {
  assertInvoiceTransition,
  effectiveInvoiceStatus,
} from './invoice-status.policy';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const text = (value?: string | null) => value?.trim() || null;
const includeItems = { items: { orderBy: { position: 'asc' as const } } };
const companySnapshotSelect = {
  name: true,
  organisationNumber: true,
  email: true,
  phone: true,
  website: true,
  addressLine1: true,
  addressLine2: true,
  postalCode: true,
  city: true,
  countryCode: true,
  vatRegistered: true,
  vatNumber: true,
  bankAccount: true,
  iban: true,
  bic: true,
} satisfies Prisma.CompanySelect;
const customerSnapshotSelect = {
  companyName: true,
  type: true,
  organisationNumber: true,
  contactName: true,
  email: true,
  phone: true,
  billingAddressLine1: true,
  billingAddressLine2: true,
  billingPostalCode: true,
  billingCity: true,
  countryCode: true,
  vatNumber: true,
} satisfies Prisma.CustomerSelect;

const detailView = <
  T extends {
    items: Array<{ quantity: Prisma.Decimal; vatRate: Prisma.Decimal }>;
  },
>(
  invoice: T,
) => ({
  ...invoice,
  items: invoice.items.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    vatRate: Number(item.vatRate),
  })),
});

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicePdf: InvoicePdfService,
  ) {}

  async list(companyId: string, query: ListInvoicesQueryDto) {
    const search = query.search?.trim();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const statusWhere: Prisma.InvoiceWhereInput =
      query.status === InvoiceStatus.OVERDUE
        ? {
            OR: [
              { status: InvoiceStatus.OVERDUE },
              {
                status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.SENT] },
                dueDate: { lt: today },
              },
            ],
          }
        : query.status
          ? {
              status: query.status,
              ...(query.status === InvoiceStatus.ISSUED ||
              query.status === InvoiceStatus.SENT
                ? { dueDate: { gte: today } }
                : {}),
            }
          : {};
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        archivedAt: null,
        ...statusWhere,
        ...(search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' as const } },
                {
                  customerNameSnapshot: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  reference: { contains: search, mode: 'insensitive' as const },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    });
    return invoices.map((invoice) => ({
      ...invoice,
      status: effectiveInvoiceStatus(invoice.status, invoice.dueDate),
    }));
  }

  async get(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { companyId, id, archivedAt: null },
      include: includeItems,
    });
    if (!invoice) throw new NotFoundException('Invoice was not found');
    return detailView({
      ...invoice,
      status: effectiveInvoiceStatus(invoice.status, invoice.dueDate),
    });
  }

  async create(companyId: string, dto: InvoiceDraftDto) {
    this.validateDates(dto);
    const { company, customer } = await this.validateRelations(companyId, dto);
    const calculated = calculateInvoice(dto.items);
    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        customerId: dto.customerId,
        issueDate: date(dto.issueDate),
        dueDate: date(dto.dueDate),
        currency: dto.currency,
        reference: text(dto.reference),
        purchaseOrderReference: text(dto.purchaseOrderReference),
        notes: text(dto.notes),
        paymentTerms: text(dto.paymentTerms),
        customerNameSnapshot: customer.companyName,
        companyNameSnapshot: company.name,
        customerSnapshot: customer,
        companySnapshot: company,
        subtotalMinor: calculated.subtotalMinor,
        vatMinor: calculated.vatMinor,
        totalMinor: calculated.totalMinor,
        items: {
          create: calculated.items.map((item) => ({
            productId: item.productId || null,
            description: item.description.trim(),
            quantity: item.quantity,
            unit: item.unit.trim(),
            unitPriceMinor: item.unitPriceMinor,
            vatRate: item.vatRate,
            subtotalMinor: item.subtotalMinor,
            vatMinor: item.vatMinor,
            totalMinor: item.totalMinor,
            position: item.position,
          })),
        },
      },
      include: includeItems,
    });
    return detailView(invoice);
  }

  async update(companyId: string, id: string, dto: UpdateInvoiceDraftDto) {
    this.validateDates(dto);
    const { company, customer } = await this.validateRelations(companyId, dto);
    const calculated = calculateInvoice(dto.items);
    const invoice = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.invoice.updateMany({
        where: {
          id,
          companyId,
          status: InvoiceStatus.DRAFT,
          archivedAt: null,
          version: dto.version,
        },
        data: {
          customerId: dto.customerId,
          issueDate: date(dto.issueDate),
          dueDate: date(dto.dueDate),
          currency: dto.currency,
          reference: text(dto.reference),
          purchaseOrderReference: text(dto.purchaseOrderReference),
          notes: text(dto.notes),
          paymentTerms: text(dto.paymentTerms),
          customerNameSnapshot: customer.companyName,
          companyNameSnapshot: company.name,
          customerSnapshot: customer,
          companySnapshot: company,
          subtotalMinor: calculated.subtotalMinor,
          vatMinor: calculated.vatMinor,
          totalMinor: calculated.totalMinor,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await transaction.invoice.findFirst({
          where: { id, companyId, archivedAt: null },
          select: { status: true, version: true },
        });
        if (!current) throw new NotFoundException('Invoice was not found');
        if (current.status !== InvoiceStatus.DRAFT) {
          throw new ConflictException('Only draft invoices can be edited');
        }
        throw new ConflictException(
          'This draft changed in another session. Reload it before saving again.',
        );
      }
      await transaction.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await transaction.invoiceItem.createMany({
        data: calculated.items.map((item) => ({
          invoiceId: id,
          productId: item.productId || null,
          description: item.description.trim(),
          quantity: item.quantity,
          unit: item.unit.trim(),
          unitPriceMinor: item.unitPriceMinor,
          vatRate: item.vatRate,
          subtotalMinor: item.subtotalMinor,
          vatMinor: item.vatMinor,
          totalMinor: item.totalMinor,
          position: item.position,
        })),
      });
      return transaction.invoice.findUniqueOrThrow({
        where: { id },
        include: includeItems,
      });
    });
    return detailView(invoice);
  }

  async duplicate(companyId: string, id: string) {
    const source = await this.get(companyId, id);
    return this.create(companyId, {
      customerId: source.customerId,
      issueDate: source.issueDate.toISOString().slice(0, 10),
      dueDate: source.dueDate.toISOString().slice(0, 10),
      currency: source.currency,
      reference: source.reference,
      purchaseOrderReference: source.purchaseOrderReference,
      notes: source.notes,
      paymentTerms: source.paymentTerms,
      items: source.items.map((item) => ({
        productId: null,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPriceMinor: item.unitPriceMinor,
        vatRate: Number(item.vatRate),
      })),
    });
  }

  async issue(companyId: string, id: string, dto: IssueInvoiceDto) {
    const issuedAt = new Date();
    const invoice = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.invoice.findFirst({
        where: { id, companyId, archivedAt: null },
        select: { status: true, version: true },
      });
      if (!current) throw new NotFoundException('Invoice was not found');
      assertInvoiceTransition(current.status, InvoiceStatus.ISSUED);
      if (current.version !== dto.version) {
        throw new ConflictException(
          'This draft changed in another session. Reload it before issuing.',
        );
      }
      const settings = await transaction.companySettings.update({
        where: { companyId },
        data: { nextInvoiceNumber: { increment: 1 } },
        select: {
          invoicePrefix: true,
          invoiceNumberPadding: true,
          nextInvoiceNumber: true,
        },
      });
      const sequence = settings.nextInvoiceNumber - 1;
      const number = `${settings.invoicePrefix}-${String(sequence).padStart(
        settings.invoiceNumberPadding,
        '0',
      )}`;
      const result = await transaction.invoice.updateMany({
        where: {
          id,
          companyId,
          status: InvoiceStatus.DRAFT,
          archivedAt: null,
          version: dto.version,
        },
        data: {
          number,
          status: InvoiceStatus.ISSUED,
          issuedAt,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1) {
        throw new ConflictException('Invoice could not be issued');
      }
      return transaction.invoice.findUniqueOrThrow({
        where: { id },
        include: includeItems,
      });
    });
    return detailView(invoice);
  }

  async markSent(companyId: string, id: string) {
    const current = await this.findLifecycleInvoice(companyId, id);
    assertInvoiceTransition(current.status, InvoiceStatus.SENT);
    const result = await this.prisma.invoice.updateMany({
      where: { id, companyId, status: current.status, archivedAt: null },
      data: {
        status: InvoiceStatus.SENT,
        sentAt: new Date(),
        version: { increment: 1 },
      },
    });
    if (result.count !== 1)
      throw new ConflictException('Invoice status changed');
    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: includeItems,
    });
    return detailView(invoice);
  }

  async void(companyId: string, id: string, dto: VoidInvoiceDto) {
    const current = await this.findLifecycleInvoice(companyId, id);
    assertInvoiceTransition(current.status, InvoiceStatus.VOID);
    const result = await this.prisma.invoice.updateMany({
      where: { id, companyId, status: current.status, archivedAt: null },
      data: {
        status: InvoiceStatus.VOID,
        voidedAt: new Date(),
        voidReason: dto.reason.trim(),
        version: { increment: 1 },
      },
    });
    if (result.count !== 1)
      throw new ConflictException('Invoice status changed');
    const invoice = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: includeItems,
    });
    return detailView(invoice);
  }

  async pdf(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId, archivedAt: null },
      include: includeItems,
    });
    if (!invoice) throw new NotFoundException('Invoice was not found');
    if (invoice.status === InvoiceStatus.DRAFT || !invoice.number) {
      throw new ConflictException(
        'Issue the invoice before downloading its PDF',
      );
    }
    return this.invoicePdf.render(invoice);
  }

  async archive(companyId: string, id: string) {
    const result = await this.prisma.invoice.updateMany({
      where: { id, companyId, status: InvoiceStatus.DRAFT, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    if (result.count === 0) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id, companyId, archivedAt: null },
        select: { status: true },
      });
      if (!invoice) throw new NotFoundException('Invoice was not found');
      throw new ConflictException('Only draft invoices can be archived');
    }
    return { archived: true };
  }

  private validateDates(dto: InvoiceDraftDto) {
    if (date(dto.dueDate) < date(dto.issueDate)) {
      throw new BadRequestException('Due date cannot be before issue date');
    }
  }

  private async findLifecycleInvoice(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId, archivedAt: null },
      select: { id: true, status: true },
    });
    if (!invoice) throw new NotFoundException('Invoice was not found');
    return invoice;
  }

  private async validateRelations(companyId: string, dto: InvoiceDraftDto) {
    const productIds = [
      ...new Set(
        dto.items.flatMap((item) => (item.productId ? [item.productId] : [])),
      ),
    ];
    const [company, customer, products] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: companySnapshotSelect,
      }),
      this.prisma.customer.findFirst({
        where: { id: dto.customerId, companyId, status: { not: 'ARCHIVED' } },
        select: customerSnapshotSelect,
      }),
      productIds.length
        ? this.prisma.product.findMany({
            where: { id: { in: productIds }, companyId, active: true },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);
    if (!company) throw new NotFoundException('Company was not found');
    if (!customer) throw new BadRequestException('Select an active customer');
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }
    return { company, customer };
  }
}
