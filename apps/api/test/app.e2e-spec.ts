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
  let createdUserId: string | undefined;
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
      .send({ companyName: 'Blocked without CSRF' })
      .expect(403);
  });

  it('allows authenticated customer CRUD with CSRF', async () => {
    const created = await agent
      .post('/api/v1/customers')
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

    await agent.get(`/api/v1/customers/${createdCustomerId}`).expect(200);
    await agent
      .patch(`/api/v1/customers/${createdCustomerId}`)
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
      .set('x-csrf-token', csrfToken)
      .expect(204);
    createdCustomerId = undefined;
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
    if (createdCustomerId) {
      await prisma.customer.deleteMany({ where: { id: createdCustomerId } });
    }
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    await app.close();
  });
});
