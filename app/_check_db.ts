import { PrismaClient } from './node_modules/.prisma/client/index.js';
const p = new PrismaClient();

async function main() {
  // Check ALL daily logs (no date filter)
  const allLogs = await p.dailyVehicleLog.findMany({
    orderBy: { logDate: 'desc' },
    select: { id: true, logDate: true, plateNumber: true, driverName: true, status: true, vehicleId: true, checkInTime: true }
  });
  console.log('=== ALL DailyVehicleLogs ===');
  console.log(JSON.stringify(allLogs, null, 2));
  console.log('Total:', allLogs.length);
  
  // Check today's date
  const now = new Date();
  console.log('\n=== Date Debug ===');
  console.log('Now:', now.toISOString());
  console.log('Now (local):', now.toString());
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  console.log('todayStart:', todayStart.toISOString());
  console.log('tomorrowStart:', tomorrowStart.toISOString());
  
  // Check if query matches
  const todayLogs = await p.dailyVehicleLog.findMany({
    where: { logDate: { gte: todayStart, lt: tomorrowStart } }
  });
  console.log('\n=== Today logs (range query) ===');
  console.log('Found:', todayLogs.length);
  
  // Check with exact date
  const exactDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const exactLogs = await p.dailyVehicleLog.findMany({
    where: { logDate: exactDate }
  });
  console.log('\n=== Today logs (exact query) ===');
  console.log('Found:', exactLogs.length);

  // Check vehicles
  const vehicles = await p.vehicle.findMany({
    select: { id: true, plateNumber: true, status: true, activeLogId: true }
  });
  console.log('\n=== Vehicles ===');
  console.log(JSON.stringify(vehicles, null, 2));

  await p['$disconnect']();
}
main();
