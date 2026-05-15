import { PrismaClient } from './node_modules/.prisma/client/index.js';
const p = new PrismaClient();

async function main() {
  // The existing log was created today (May 6 local) but stored as May 5 due to timezone bug
  // Fix: update logDate to correct UTC midnight for today
  const now = new Date();
  const correctDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  
  console.log('Correct today UTC midnight:', correctDate.toISOString());
  
  // Find logs that were checked in today but have wrong date
  const logs = await p.dailyVehicleLog.findMany({
    where: { status: 'active' }
  });
  
  for (const log of logs) {
    const checkInLocal = log.checkInTime ? new Date(log.checkInTime) : null;
    if (checkInLocal) {
      const checkInDate = new Date(Date.UTC(checkInLocal.getFullYear(), checkInLocal.getMonth(), checkInLocal.getDate(), 0, 0, 0, 0));
      
      if (log.logDate.getTime() !== checkInDate.getTime()) {
        console.log(`🔧 Fixing log ${log.id}: logDate ${log.logDate.toISOString()} → ${checkInDate.toISOString()}`);
        
        // Check if a log already exists for the correct date
        const existing = await p.dailyVehicleLog.findFirst({
          where: { vehicleId: log.vehicleId, logDate: checkInDate, id: { not: log.id } }
        });
        
        if (!existing) {
          await p.dailyVehicleLog.update({
            where: { id: log.id },
            data: { logDate: checkInDate }
          });
          console.log('  ✅ Fixed!');
        } else {
          console.log('  ⚠️ Correct date already has a log, skipping');
        }
      } else {
        console.log(`✅ Log ${log.id} date is correct: ${log.logDate.toISOString()}`);
      }
    }
  }
  
  // Verify
  const allLogs = await p.dailyVehicleLog.findMany({
    select: { id: true, logDate: true, plateNumber: true, driverName: true, status: true }
  });
  console.log('\n=== Updated logs ===');
  console.log(JSON.stringify(allLogs, null, 2));
  
  await p['$disconnect']();
}
main();
