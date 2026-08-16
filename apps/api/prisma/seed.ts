import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../src/auth/password.service';
import { DEFAULT_EXPENSE_CATEGORIES } from '../src/expenses/default-categories';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const fictionalCustomers = [
  {
    companyName: 'Nordlys Studio Demo AS',
    contactName: 'Ida Solberg',
    email: 'ida@example.test',
    phone: '+47 400 00 001',
  },
  {
    companyName: 'Fjord & Form Demo AS',
    contactName: 'Emil Strand',
    email: 'emil@example.test',
    phone: '+47 400 00 002',
  },
];

async function seed() {
  const passwordHash = await new PasswordService().hash(
    'ledgerly-demo-password',
  );
  const user = await prisma.user.upsert({
    where: { email: 'demo@ledgerly.local' },
    update: {},
    create: {
      email: 'demo@ledgerly.local',
      fullName: 'Ledgerly Demo Owner',
      passwordHash,
    },
  });
  const company = await prisma.company.upsert({
    where: { slug: 'ledgerly-demo' },
    update: {},
    create: {
      name: 'Ledgerly Demo AS',
      slug: 'ledgerly-demo',
      settings: { create: {} },
    },
  });
  await prisma.companyMember.upsert({
    where: { userId_companyId: { userId: user.id, companyId: company.id } },
    update: { role: 'OWNER' },
    create: { userId: user.id, companyId: company.id, role: 'OWNER' },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { selectedCompanyId: company.id },
  });
  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({
      where: {
        companyId_systemKey: {
          companyId: company.id,
          systemKey: category.systemKey,
        },
      },
      update: {},
      create: { ...category, companyId: company.id },
    });
  }

  for (const customer of fictionalCustomers) {
    const exists = await prisma.customer.findFirst({
      where: { companyId: company.id, companyName: customer.companyName },
    });
    if (!exists) {
      await prisma.customer.create({
        data: { ...customer, companyId: company.id },
      });
    }
  }
}

seed()
  .then(() => console.log('Seeded fictional Ledgerly development data.'))
  .finally(() => prisma.$disconnect());
