import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.driver.findUnique({ where: { code: 'DRV-001' } });
  if (driver) {
    await prisma.shippingOrder.deleteMany({ where: { assignedDriverId: driver.id } });
    await prisma.driver.delete({ where: { id: driver.id } });
    console.log('Deleted fake driver and their shipping orders!');
  } else {
    console.log('Fake driver not found.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
