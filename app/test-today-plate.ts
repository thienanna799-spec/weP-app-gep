import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // All daily logs for the last 7 days
  const logs = await prisma.dailyVehicleLog.findMany({
    orderBy: { logDate: 'desc' },
    take: 20,
    select: {
      id: true,
      driverName: true,
      plateNumber: true,
      logDate: true,
      status: true,
      checkInTime: true,
      checkOutTime: true,
    },
  });

  console.log('=== ALL DAILY LOGS (last 20) ===');
  if (logs.length === 0) {
    console.log('NO LOGS FOUND AT ALL!');
  } else {
    logs.forEach(l => {
      console.log(`${l.driverName} | ${l.plateNumber} | date: ${l.logDate.toISOString().split('T')[0]} | status: ${l.status} | in: ${l.checkInTime} | out: ${l.checkOutTime}`);
    });
  }

  // Check vehicles
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, plateNumber: true, status: true, activeLogId: true },
  });
  console.log('\n=== VEHICLES ===');
  vehicles.forEach(v => {
    console.log(`${v.plateNumber} | status: ${v.status} | activeLogId: ${v.activeLogId || 'NONE'}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
