import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const orders = await prisma.order.findMany({ where: { customerId: null } });
  let count = 0;
  for (const o of orders) {
    const customer = await prisma.customer.findFirst({ where: { phone: o.customerPhone } });
    if (customer) {
      await prisma.order.update({ where: { id: o.id }, data: { customerId: customer.id } });
      count++;
    }
  }
  console.log(`Updated ${count} orders missing customerId`);
  await prisma.$disconnect();
}

main().catch(console.error);
