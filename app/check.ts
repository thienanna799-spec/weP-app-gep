import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const custId = 'cmoiadzoa0010bx1cbkg27obj';
  
  // Simulate exactly what the API does
  const pricing = await prisma.customerPricing.findMany({
    where: { customerId: custId },
    orderBy: { updatedAt: 'desc' },
  });
  
  console.log('=== Raw pricing result (what API returns) ===');
  console.log(JSON.stringify(pricing, null, 2));
  console.log('\n=== Fields per entry ===');
  if (pricing.length > 0) {
    console.log('Keys:', Object.keys(pricing[0]));
    // Check the WB-RIM entry specifically
    const wb = pricing.find(p => p.sku.includes('WB-RIM'));
    console.log('\nWB-RIM entry:', JSON.stringify(wb, null, 2));
    console.log('SKU exact value:', JSON.stringify(wb?.sku));
    console.log('SKU length:', wb?.sku.length);
    console.log('SKU char codes:', [...(wb?.sku || '')].map(c => c.charCodeAt(0)));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
