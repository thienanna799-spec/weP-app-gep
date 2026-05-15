import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const order = await prisma.order.findUnique({
    where: { code: 'ORD-136092' },
    include: { customer: true }
  });
  console.log('Order:', order?.code);
  console.log('CustomerID:', order?.customerId);
  console.log('Customer:', order?.customer?.name);
  console.log('Customer Telegram:', order?.customer?.telegramChatId);
  await prisma.$disconnect();
}

main().catch(console.error);
