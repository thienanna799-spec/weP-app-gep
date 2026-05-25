import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const drivers = await prisma.driver.findMany();
  let found = false;
  for (const d of drivers) {
    if ((d.avatar?.length || 0) > 100) {
      console.log(`Found driver with real avatar: ${d.name} (${d.code}) - avatar length: ${d.avatar?.length}`);
      found = true;
    }
    if ((d.idCardPhoto?.length || 0) > 100) {
      console.log(`Found driver with real idCardPhoto: ${d.name} (${d.code}) - idCardPhoto length: ${d.idCardPhoto?.length}`);
      found = true;
    }
  }
  if (!found) {
    console.log('No drivers found with real base64 images (length > 100).');
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
