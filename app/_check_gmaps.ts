import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  // Find the actual table name first
  const tables: any[] = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE '%ustomer%'`);
  console.log('📋 Tables matching "customer":', JSON.stringify(tables));
  
  // Try information_schema
  const cols: any[] = await prisma.$queryRawUnsafe(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'bocchongsoc' AND COLUMN_NAME = 'googleMapsLink'`
  );
  console.log('✅ googleMapsLink column:', JSON.stringify(cols, null, 2));
  
  // Also count customers
  const count = await prisma.customer.count();
  console.log(`📊 Total customers in DB: ${count}`);
  
  await prisma.$disconnect();
}

check().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
