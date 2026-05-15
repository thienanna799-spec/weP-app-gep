import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const where: any = {};
  where.isActive = true;

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, code: true, isActive: true }
  });

  console.log("Customers with isActive = true:");
  console.table(customers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
