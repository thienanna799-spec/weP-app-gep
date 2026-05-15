import { PrismaClient } from './node_modules/.prisma/client/index.js';
const p = new PrismaClient();

async function main() {
  console.log('🔧 Resetting vehicle statuses...');
  
  // Find all vehicles
  const vehicles = await p.vehicle.findMany();
  
  for (const v of vehicles) {
    // Check if there's an active DailyVehicleLog for this vehicle
    const activeLog = await p.dailyVehicleLog.findFirst({
      where: { vehicleId: v.id, status: 'active' },
    });
    
    if (activeLog) {
      // Vehicle has an active session → keep as in_use
      console.log(`  ✅ ${v.plateNumber}: has active log → in_use`);
      await p.vehicle.update({
        where: { id: v.id },
        data: { status: 'in_use', activeLogId: activeLog.id },
      });
    } else {
      // No active session → reset to available
      console.log(`  🔄 ${v.plateNumber}: no active log → available`);
      await p.vehicle.update({
        where: { id: v.id },
        data: { status: 'available', activeLogId: null },
      });
    }
  }
  
  // Also reset driver currentVehicleId since no logs exist
  const logs = await p.dailyVehicleLog.count();
  if (logs === 0) {
    console.log('\n⚠️  DailyVehicleLog is empty — resetting all driver vehicle assignments');
    await p.driver.updateMany({
      data: { currentVehicleId: null },
    });
  }
  
  console.log('\n✅ Done! Vehicle statuses fixed.');
  await p['$disconnect']();
}
main();
