import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const all = await prisma.customer.findMany({
    select: { id: true, name: true, code: true, isActive: true, operationalStatus: true }
  });
  console.log("All Customers:");
  console.table(all);
}

main().catch(console.error).finally(() => prisma.$disconnect());
