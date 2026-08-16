import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface CustomerResponse {
  id: string;
  companyName: string;
  status: string;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdCustomerId: string | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/customers (CRUD)', async () => {
    const created = await request(app.getHttpServer())
      .post('/customers')
      .send({
        companyName: 'Ledgerly API Test Customer',
        contactName: 'Test Contact',
        email: 'api-test@ledgerly.local',
      })
      .expect(201);

    const createdBody = created.body as unknown as CustomerResponse;
    createdCustomerId = createdBody.id;
    expect(createdBody).toMatchObject({
      companyName: 'Ledgerly API Test Customer',
      status: 'ACTIVE',
    });

    await request(app.getHttpServer())
      .get(`/customers/${createdCustomerId}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as CustomerResponse;
        expect(body.id).toBe(createdCustomerId);
      });

    await request(app.getHttpServer())
      .patch(`/customers/${createdCustomerId}`)
      .send({ status: 'ARCHIVED' })
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as CustomerResponse;
        expect(body.status).toBe('ARCHIVED');
      });

    await request(app.getHttpServer())
      .patch(`/customers/${createdCustomerId}`)
      .send({ contactName: null, email: null })
      .expect(200)
      .expect((response) => {
        const body = response.body as unknown as CustomerResponse & {
          contactName: string | null;
          email: string | null;
        };
        expect(body.contactName).toBeNull();
        expect(body.email).toBeNull();
      });

    await request(app.getHttpServer())
      .delete(`/customers/${createdCustomerId}`)
      .expect(204);
    createdCustomerId = undefined;
  });

  afterAll(async () => {
    if (createdCustomerId) {
      await prisma.customer.deleteMany({ where: { id: createdCustomerId } });
    }
    await app.close();
  });
});
