import { NotFoundException } from '@nestjs/common';
import { CustomerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const companyId = '8d47a023-9760-42d5-a6bb-24df1a39be21';
  const customer = {
    id: '2f8d4827-77ac-428c-a70d-9569b0ebbf2e',
    companyId,
    companyName: 'Nordlys Studio AS',
    contactName: 'Ida Solberg',
    email: 'ida@nordlys.no',
    phone: null,
    status: CustomerStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = {
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new CustomersService(prisma as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('creates a customer', async () => {
    prisma.customer.create.mockResolvedValue(customer);

    await expect(
      service.create(companyId, { companyName: customer.companyName }),
    ).resolves.toEqual(customer);
  });

  it('lists customers alphabetically', async () => {
    prisma.customer.findMany.mockResolvedValue([customer]);

    await expect(service.findAll(companyId)).resolves.toEqual([customer]);
    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      where: { companyId },
      orderBy: { companyName: 'asc' },
    });
  });

  it('throws when a customer does not exist', async () => {
    prisma.customer.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(companyId, customer.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an existing customer', async () => {
    const updated = { ...customer, status: CustomerStatus.ARCHIVED };
    prisma.customer.findFirst.mockResolvedValue(customer);
    prisma.customer.update.mockResolvedValue(updated);

    await expect(
      service.update(companyId, customer.id, {
        status: CustomerStatus.ARCHIVED,
      }),
    ).resolves.toEqual(updated);
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { companyId, id: customer.id },
      data: { status: CustomerStatus.ARCHIVED },
    });
  });

  it('deletes an existing customer', async () => {
    prisma.customer.findFirst.mockResolvedValue(customer);
    prisma.customer.delete.mockResolvedValue(customer);

    await expect(
      service.remove(companyId, customer.id),
    ).resolves.toBeUndefined();
    expect(prisma.customer.delete).toHaveBeenCalledWith({
      where: { companyId, id: customer.id },
    });
  });
});
