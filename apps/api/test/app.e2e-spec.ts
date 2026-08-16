import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from './../src/app.setup';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface CustomerResponse {
  id: string;
  companyName: string;
  status: string;
}

interface AuthResponse {
  user: { id: string; email: string; fullName: string };
  company: { id: string; name: string; role: string };
}
interface ProductResponse {
  id: string;
  sku: string | null;
  active: boolean;
  unitPriceMinor: number;
  defaultQuantity: number;
  vatRate: number;
}
interface InvoiceResponse {
  id: string;
  number: string | null;
  version: number;
  status: string;
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
}
interface PaymentResultResponse {
  payment: { id: string; reversedAt: string | null };
  balance: {
    amountPaidMinor: number;
    remainingMinor: number;
    status: string;
  };
}

const csrfFrom = (response: request.Response): string => {
  const values = response.headers['set-cookie'] as unknown as
    string[] | undefined;
  const csrfCookie = values?.find((value) =>
    value.startsWith('ledgerly_csrf='),
  );
  const token = csrfCookie?.split(';', 1)[0]?.split('=', 2)[1];
  if (!token) throw new Error('Response did not set a CSRF cookie');
  return token;
};

describe('Ledgerly API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let agent: ReturnType<typeof request.agent>;
  let csrfToken = '';
  let createdCustomerId: string | undefined;
  let invoiceCustomerId: string | undefined;
  const createdProductIds: string[] = [];
  const createdInvoiceIds: string[] = [];
  let createdUserId: string | undefined;
  let primaryCompanyId = '';
  let accountantCompanyId = '';
  let outsiderCompanyId = '';
  const email = `ledgerly-e2e-${Date.now()}@example.test`;
  const password = 'e2e-password-that-is-long';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    agent = request.agent(app.getHttpServer());
  });

  it('serves public health while protecting business endpoints', async () => {
    await request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect({ service: 'ledgerly-api', status: 'ok' });
    await request(app.getHttpServer()).get('/api/v1/customers').expect(401);
  });

  it('rejects cross-origin authentication submissions', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('origin', 'https://malicious.example')
      .send({ email: 'attacker@example.test', password: 'irrelevant' })
      .expect(403);
  });

  it('registers an owner and initial company transactionally', async () => {
    const response = await agent
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Ledgerly E2E Company',
        email,
        fullName: 'Ledgerly Test Owner',
        password,
      })
      .expect(201);
    const body = response.body as unknown as AuthResponse;
    createdUserId = body.user.id;
    primaryCompanyId = body.company.id;
    csrfToken = csrfFrom(response);
    expect(body).toMatchObject({
      user: { email, fullName: 'Ledgerly Test Owner' },
      company: { name: 'Ledgerly E2E Company', role: 'OWNER' },
    });
    expect(JSON.stringify(body)).not.toContain('password');

    const persisted = await prisma.user.findUnique({
      where: { id: createdUserId },
      include: {
        memberships: { include: { company: { include: { settings: true } } } },
      },
    });
    expect(persisted?.memberships[0]?.company.settings).not.toBeNull();

    const accountantCompany = await prisma.company.create({
      data: {
        name: 'Ledgerly Accountant Company',
        slug: `ledgerly-accountant-${Date.now()}`,
        settings: { create: {} },
        memberships: {
          create: { role: 'ACCOUNTANT', userId: createdUserId },
        },
      },
    });
    accountantCompanyId = accountantCompany.id;
    const outsiderCompany = await prisma.company.create({
      data: {
        name: 'Ledgerly Unrelated Company',
        slug: `ledgerly-unrelated-${Date.now()}`,
        settings: { create: {} },
      },
    });
    outsiderCompanyId = outsiderCompany.id;
  });

  it('lists memberships, persists company selection and updates owner settings', async () => {
    await agent
      .get('/api/v1/companies')
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(2);
      });

    await agent
      .patch(`/api/v1/companies/${primaryCompanyId}`)
      .set('x-csrf-token', csrfToken)
      .send({
        city: 'Oslo',
        defaultCurrency: 'NOK',
        defaultPaymentDays: 21,
        vatRegistered: true,
        invoicePrefix: 'TEST',
        invoiceNumberPadding: 5,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          city: 'Oslo',
          settings: {
            defaultPaymentDays: 21,
            invoicePrefix: 'TEST',
            invoiceNumberPadding: 5,
          },
          vatRegistered: true,
        });
      });

    await agent
      .put('/api/v1/companies/current')
      .set('x-csrf-token', csrfToken)
      .send({ companyId: accountantCompanyId })
      .expect(200)
      .expect((response) => {
        expect((response.body as unknown as AuthResponse).company.id).toBe(
          accountantCompanyId,
        );
      });
    await agent
      .get('/api/v1/auth/me')
      .expect(200)
      .expect((response) => {
        expect((response.body as unknown as AuthResponse).company.id).toBe(
          accountantCompanyId,
        );
      });
    await agent
      .put('/api/v1/companies/current')
      .set('x-csrf-token', csrfToken)
      .send({ companyId: primaryCompanyId })
      .expect(200);
  });

  it('enforces company membership and the centralized role policy', async () => {
    await agent
      .get('/api/v1/customers')
      .set('x-company-id', outsiderCompanyId)
      .expect(403);
    await agent
      .post('/api/v1/customers')
      .set('x-company-id', accountantCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ companyName: 'Accountant cannot create this' })
      .expect(403);
    await agent
      .patch(`/api/v1/companies/${accountantCompanyId}`)
      .set('x-csrf-token', csrfToken)
      .send({ city: 'Bergen' })
      .expect(403);
  });

  it('returns the current authenticated profile', async () => {
    await agent
      .get('/api/v1/auth/me')
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as AuthResponse;
        expect(body.user.email).toBe(email);
      });
  });

  it('requires CSRF for authenticated mutations', async () => {
    await agent
      .post('/api/v1/customers')
      .set('x-company-id', primaryCompanyId)
      .send({ companyName: 'Blocked without CSRF' })
      .expect(403);
  });

  it('allows authenticated customer CRUD with CSRF', async () => {
    const created = await agent
      .post('/api/v1/customers')
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({
        companyName: 'Ledgerly API Test Customer',
        contactName: 'Test Contact',
        email: 'api-test@example.test',
      })
      .expect(201);

    const createdBody = created.body as unknown as CustomerResponse;
    createdCustomerId = createdBody.id;
    expect(createdBody).toMatchObject({
      companyName: 'Ledgerly API Test Customer',
      status: 'ACTIVE',
    });

    await agent
      .get(`/api/v1/customers/${createdCustomerId}`)
      .set('x-company-id', primaryCompanyId)
      .expect(200);
    await agent
      .get(`/api/v1/customers/${createdCustomerId}`)
      .set('x-company-id', accountantCompanyId)
      .expect(404);
    await agent
      .patch(`/api/v1/customers/${createdCustomerId}`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ status: 'ARCHIVED' })
      .expect(200)
      .expect((response) => {
        expect((response.body as unknown as CustomerResponse).status).toBe(
          'ARCHIVED',
        );
      });
    await agent
      .delete(`/api/v1/customers/${createdCustomerId}`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .expect(204);
  });

  it('creates, duplicates and archives precise catalogue items', async () => {
    const created = await agent
      .post('/api/v1/products')
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({
        name: 'Consulting',
        description: 'Technical consulting',
        sku: 'CONSULT',
        type: 'SERVICE',
        unit: 'hour',
        defaultQuantity: 1.5,
        unitPriceMinor: 120000,
        vatRate: 25,
        currency: 'NOK',
        category: 'Services',
        active: true,
      })
      .expect(201);
    const createdBody = created.body as unknown as ProductResponse;
    createdProductIds.push(createdBody.id);
    expect(createdBody).toMatchObject({
      unitPriceMinor: 120000,
      defaultQuantity: 1.5,
      vatRate: 25,
    });
    const duplicate = await agent
      .post(`/api/v1/products/${createdBody.id}/duplicate`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .expect(201);
    const duplicateBody = duplicate.body as unknown as ProductResponse;
    createdProductIds.push(duplicateBody.id);
    expect(duplicateBody.sku).toBeNull();
    await agent
      .delete(`/api/v1/products/${createdBody.id}`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .expect(200)
      .expect((response) =>
        expect((response.body as unknown as ProductResponse).active).toBe(
          false,
        ),
      );
  });

  it('persists tenant-scoped drafts and rejects stale totals updates', async () => {
    const customer = await agent
      .post('/api/v1/customers')
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ companyName: 'Invoice Test Customer' })
      .expect(201);
    invoiceCustomerId = (customer.body as unknown as CustomerResponse).id;
    const draft = {
      customerId: invoiceCustomerId,
      issueDate: '2026-08-16',
      dueDate: '2026-08-30',
      currency: 'NOK',
      notes: 'Draft note',
      items: [
        {
          description: 'Fractional consulting',
          quantity: 1.5,
          unit: 'hour',
          unitPriceMinor: 120000,
          vatRate: 25,
        },
      ],
    };
    await agent
      .post('/api/v1/invoices')
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ ...draft, totalMinor: 1 })
      .expect(400);
    const created = await agent
      .post('/api/v1/invoices')
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send(draft)
      .expect(201);
    const createdBody = created.body as unknown as InvoiceResponse;
    createdInvoiceIds.push(createdBody.id);
    expect(createdBody).toMatchObject({
      status: 'DRAFT',
      version: 1,
      subtotalMinor: 180000,
      vatMinor: 45000,
      totalMinor: 225000,
    });

    await agent
      .get(`/api/v1/invoices/${createdBody.id}`)
      .set('x-company-id', accountantCompanyId)
      .expect(404);
    await agent
      .patch(`/api/v1/invoices/${createdBody.id}`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({
        ...draft,
        version: 1,
        items: [{ ...draft.items[0], quantity: 2 }],
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          version: 2,
          subtotalMinor: 240000,
          totalMinor: 300000,
        });
      });
    await agent
      .patch(`/api/v1/invoices/${createdBody.id}`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ ...draft, version: 1 })
      .expect(409);

    const parallelDraft = await agent
      .post(`/api/v1/invoices/${createdBody.id}/duplicate`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .expect(201);
    const parallelBody = parallelDraft.body as unknown as InvoiceResponse;
    createdInvoiceIds.push(parallelBody.id);
    const [issued, parallelIssued] = await Promise.all([
      agent
        .post(`/api/v1/invoices/${createdBody.id}/issue`)
        .set('x-company-id', primaryCompanyId)
        .set('x-csrf-token', csrfToken)
        .send({ version: 2 })
        .expect(201),
      agent
        .post(`/api/v1/invoices/${parallelBody.id}/issue`)
        .set('x-company-id', primaryCompanyId)
        .set('x-csrf-token', csrfToken)
        .send({ version: 1 })
        .expect(201),
    ]);
    const issuedBody = issued.body as unknown as InvoiceResponse;
    const parallelIssuedBody =
      parallelIssued.body as unknown as InvoiceResponse;
    expect(issuedBody.status).toBe('ISSUED');
    expect(issuedBody.number).toMatch(/^TEST-\d{5}$/);
    expect(parallelIssuedBody.number).toMatch(/^TEST-\d{5}$/);
    expect(parallelIssuedBody.number).not.toBe(issuedBody.number);

    await agent
      .patch(`/api/v1/invoices/${createdBody.id}`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ ...draft, version: issuedBody.version })
      .expect(409);
    await agent
      .get(`/api/v1/invoices/${createdBody.id}/pdf`)
      .set('x-company-id', primaryCompanyId)
      .expect('content-type', 'application/pdf')
      .expect('content-disposition', /attachment; filename="TEST-\d{5}\.pdf"/)
      .expect(200)
      .expect((response) => {
        expect(
          Buffer.from(response.body as ArrayBuffer)
            .subarray(0, 4)
            .toString(),
        ).toBe('%PDF');
      });
    await agent
      .get(`/api/v1/invoices/${createdBody.id}/pdf`)
      .set('x-company-id', accountantCompanyId)
      .expect(404);
    await agent
      .post(`/api/v1/invoices/${createdBody.id}/mark-sent`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .expect(201)
      .expect((response) =>
        expect(response.body).toMatchObject({ status: 'SENT' }),
      );
    await agent
      .get(`/api/v1/invoices/${createdBody.id}/payments`)
      .set('x-company-id', accountantCompanyId)
      .expect(404);
    const firstPayment = await agent
      .post(`/api/v1/invoices/${createdBody.id}/payments`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({
        amountMinor: 120000,
        paymentDate: '2026-08-16',
        method: 'BANK_TRANSFER',
        reference: 'PAYMENT-ONE',
      })
      .expect(201);
    const firstPaymentBody =
      firstPayment.body as unknown as PaymentResultResponse;
    expect(firstPaymentBody.balance).toEqual({
      amountPaidMinor: 120000,
      remainingMinor: 180000,
      status: 'PARTIALLY_PAID',
    });
    await agent
      .post(`/api/v1/invoices/${createdBody.id}/void`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ reason: 'Cannot void with payment' })
      .expect(409);

    const concurrentPayments = await Promise.all([
      agent
        .post(`/api/v1/invoices/${createdBody.id}/payments`)
        .set('x-company-id', primaryCompanyId)
        .set('x-csrf-token', csrfToken)
        .send({
          amountMinor: 180000,
          paymentDate: '2026-08-16',
          method: 'BANK_TRANSFER',
        }),
      agent
        .post(`/api/v1/invoices/${createdBody.id}/payments`)
        .set('x-company-id', primaryCompanyId)
        .set('x-csrf-token', csrfToken)
        .send({
          amountMinor: 180000,
          paymentDate: '2026-08-16',
          method: 'BANK_TRANSFER',
        }),
    ]);
    expect(
      concurrentPayments.map((response) => response.status).sort(),
    ).toEqual([201, 400]);
    const winningPayment = concurrentPayments.find(
      (response) => response.status === 201,
    );
    const winningBody =
      winningPayment?.body as unknown as PaymentResultResponse;
    expect(winningBody.balance).toEqual({
      amountPaidMinor: 300000,
      remainingMinor: 0,
      status: 'PAID',
    });
    await agent
      .post(
        `/api/v1/invoices/${createdBody.id}/payments/${winningBody.payment.id}/reverse`,
      )
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ reason: 'Bank transfer was returned' })
      .expect(201)
      .expect((response) =>
        expect(
          (response.body as unknown as PaymentResultResponse).balance,
        ).toEqual({
          amountPaidMinor: 120000,
          remainingMinor: 180000,
          status: 'PARTIALLY_PAID',
        }),
      );
    await agent
      .post(
        `/api/v1/invoices/${createdBody.id}/payments/${winningBody.payment.id}/reverse`,
      )
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ reason: 'Duplicate reversal attempt' })
      .expect(409);
    await agent
      .post(
        `/api/v1/invoices/${createdBody.id}/payments/${firstPaymentBody.payment.id}/reverse`,
      )
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ reason: 'Payment was recorded in error' })
      .expect(201)
      .expect((response) =>
        expect(
          (response.body as unknown as PaymentResultResponse).balance.status,
        ).toBe('SENT'),
      );
    await agent
      .post(`/api/v1/invoices/${createdBody.id}/void`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .send({ reason: 'Cancelled by customer' })
      .expect(201)
      .expect((response) =>
        expect(response.body).toMatchObject({
          status: 'VOID',
          voidReason: 'Cancelled by customer',
        }),
      );

    const duplicate = await agent
      .post(`/api/v1/invoices/${createdBody.id}/duplicate`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .expect(201);
    const duplicateBody = duplicate.body as unknown as InvoiceResponse;
    createdInvoiceIds.push(duplicateBody.id);
    await agent
      .delete(`/api/v1/invoices/${duplicateBody.id}`)
      .set('x-company-id', primaryCompanyId)
      .set('x-csrf-token', csrfToken)
      .expect(200)
      .expect({ archived: true });
  });

  it('rotates refresh credentials and revokes the session on logout', async () => {
    const refreshed = await agent
      .post('/api/v1/auth/refresh')
      .set('x-csrf-token', csrfToken)
      .expect(200);
    csrfToken = csrfFrom(refreshed);

    await agent
      .post('/api/v1/auth/logout')
      .set('x-csrf-token', csrfToken)
      .expect(204);
    await agent.get('/api/v1/auth/me').expect(401);
  });

  it('rejects invalid credentials without leaking account details', async () => {
    await agent
      .post('/api/v1/auth/login')
      .send({ email, password: 'definitely-not-the-password' })
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Email or password is incorrect',
        });
      });
  });

  afterAll(async () => {
    if (createdInvoiceIds.length)
      await prisma.payment.deleteMany({
        where: { invoiceId: { in: createdInvoiceIds } },
      });
    if (createdInvoiceIds.length)
      await prisma.invoice.deleteMany({
        where: { id: { in: createdInvoiceIds } },
      });
    if (createdProductIds.length)
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      });
    if (createdCustomerId) {
      await prisma.customer.deleteMany({ where: { id: createdCustomerId } });
    }
    if (invoiceCustomerId) {
      await prisma.customer.deleteMany({ where: { id: invoiceCustomerId } });
    }
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    const companyIds = [
      primaryCompanyId,
      accountantCompanyId,
      outsiderCompanyId,
    ].filter(Boolean);
    if (companyIds.length) {
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
    await app.close();
  });
});
