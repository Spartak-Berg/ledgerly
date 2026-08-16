import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const fictionalCustomers = [
  { companyName: 'Nordlys Studio Demo AS', contactName: 'Ida Solberg', email: 'ida@example.test', phone: '+47 400 00 001' },
  { companyName: 'Fjord & Form Demo AS', contactName: 'Emil Strand', email: 'emil@example.test', phone: '+47 400 00 002' },
];

async function seed() {
  for (const customer of fictionalCustomers) {
    const exists = await prisma.customer.findFirst({ where: { companyName: customer.companyName } });
    if (!exists) await prisma.customer.create({ data: customer });
  }
}

seed()
  .then(() => console.log('Seeded fictional Ledgerly development data.'))
  .finally(() => prisma.$disconnect());
