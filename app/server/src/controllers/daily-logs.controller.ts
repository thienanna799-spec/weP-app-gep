import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { OcrQueue } from '../services/ocr/queue/ocr.queue.js';

// ── Helper: emit socket event ──
function emitSocket(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

// ── Helper: normalize date to YYYY-MM-DD as UTC midnight ──
// MySQL DATE + Prisma stores as UTC 00:00:00.000Z, so we must create UTC midnight
function toLogDate(input?: string | Date): Date {
  const d = input ? new Date(input) : new Date();
  // Use UTC to match how Prisma stores @db.Date fields
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
}

// ── GET /daily-logs — Admin view (with filters) ──
export const getDailyLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { from, to, vehicleId, driverId, plateNumber } = req.query;

  const where: any = {};

  if (from || to) {
    where.logDate = {};
    if (from) where.logDate.gte = toLogDate(from as string);
    if (to) {
      const toDate = toLogDate(to as string);
      toDate.setHours(23, 59, 59, 999);
      where.logDate.lte = toDate;
    }
  }

  if (vehicleId) where.vehicleId = vehicleId;
  if (driverId) where.driverId = driverId;
  if (plateNumber) where.plateNumber = { contains: plateNumber as string };

  const logs = await prisma.dailyVehicleLog.findMany({
    where,
    orderBy: { logDate: 'desc' },
    include: {
      vehicle: { select: { id: true, plateNumber: true, type: true } },
      driver: { select: { id: true, name: true, code: true, avatar: true } },
      fuelEntries: { orderBy: { createdAt: 'asc' } },
    },
  });

  const logIds = logs.map(l => l.id);
  const fuelIds = logs.flatMap(l => l.fuelEntries.map(f => f.id));
  const referenceIds = [...logIds, ...fuelIds];

  const audits = await prisma.ocrAuditLog.findMany({
    where: {
      referenceId: { in: referenceIds }
    },
    orderBy: { createdAt: 'desc' }
  });

  const auditsByRef = audits.reduce((acc, audit) => {
    if (!acc[audit.referenceId]) acc[audit.referenceId] = [];
    acc[audit.referenceId].push(audit);
    return acc;
  }, {} as Record<string, any[]>);

  const logsWithAudits = logs.map(log => ({
    ...log,
    ocrAudits: auditsByRef[log.id] || [],
    fuelEntries: log.fuelEntries.map(fuel => ({
      ...fuel,
      ocrAudits: auditsByRef[fuel.id] || []
    }))
  }));

  sendSuccess(res, logsWithAudits);
});

// ── GET /daily-logs/me — Driver's own logs ──
export const getMyDailyLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await prisma.driver.findFirst({ where: { userId: req.user!.uid } });
  if (!driver) {
    sendError(res, 'Driver profile not found', 404);
    return;
  }

  const logs = await prisma.dailyVehicleLog.findMany({
    where: { driverId: driver.id },
    orderBy: { logDate: 'desc' },
    take: 30,
    include: {
      vehicle: { select: { id: true, plateNumber: true, type: true } },
      fuelEntries: { orderBy: { createdAt: 'asc' } },
    },
  });

  sendSuccess(res, logs);
});

// ── POST /daily-logs/check-in — Upsert session (race-condition safe) ──
export const checkInDailyLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { vehicleId, startKm, startKmPhoto } = req.body;

  if (!vehicleId || startKm === undefined) {
    sendError(res, 'vehicleId and startKm are required', 400);
    return;
  }

  // Get driver
  const driver = await prisma.driver.findFirst({ where: { userId: req.user!.uid } });
  if (!driver) {
    sendError(res, 'Driver profile not found', 404);
    return;
  }

  // Get vehicle
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    sendError(res, 'Vehicle not found', 404);
    return;
  }

  // ⚠️ Fix #6: Prevent double check-in on same vehicle
  // Auto-clear stale logs (>24h) or same-driver re-check-in
  if (vehicle.activeLogId) {
    const activeLog = await prisma.dailyVehicleLog.findUnique({ where: { id: vehicle.activeLogId } });
    if (activeLog && activeLog.status === 'active') {
      const logAge = Date.now() - new Date(activeLog.checkInTime || activeLog.createdAt).getTime();
      const isSameDriver = activeLog.driverId === driver.id;
      const isStale = logAge > 24 * 60 * 60 * 1000; // > 24 hours

      if (isStale || isSameDriver) {
        // Auto-close the stale/same-driver log
        await prisma.dailyVehicleLog.update({
          where: { id: activeLog.id },
          data: { status: 'completed', checkOutTime: new Date() },
        });
        await prisma.vehicle.update({
          where: { id: vehicleId },
          data: { activeLogId: null },
        });
        console.log(`🔄 Auto-cleared stale log for ${vehicle.plateNumber} (age: ${Math.round(logAge / 3600000)}h, sameDriver: ${isSameDriver})`);
      } else {
        sendError(res, `Xe ${vehicle.plateNumber} đang được ${activeLog.driverName} sử dụng. Vui lòng check-out trước.`, 409);
        return;
      }
    }
  }

  const logDate = toLogDate();
  const startKmVal = parseFloat(String(startKm));

  // ⚠️ Fix #4: Use upsert to prevent race condition
  const log = await prisma.dailyVehicleLog.upsert({
    where: {
      vehicleId_logDate: { vehicleId, logDate },
    },
    update: {
      // If already exists, update with new check-in data
      driverId: driver.id,
      driverName: driver.name,
      startKm: startKmVal,
      startKmPhoto: startKmPhoto || null,
      checkInTime: new Date(),
      status: 'active',
    },
    create: {
      logDate,
      vehicleId,
      driverId: driver.id,
      plateNumber: vehicle.plateNumber,
      driverName: driver.name,
      startKm: startKmVal,
      startKmPhoto: startKmPhoto || null,
      checkInTime: new Date(),
      status: 'active',
    },
    include: {
      vehicle: { select: { id: true, plateNumber: true, type: true } },
    },
  });

  // Mark vehicle as in-use + driver as delivering
  await Promise.all([
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { activeLogId: log.id, status: 'in_use' },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: { status: 'available' },
    }).catch(() => {}), // non-critical
  ]);

  // Real-time: notify web app of vehicle change
  emitSocket(req, 'driver_vehicle_updated', {
    driverId: driver.id,
    driverName: driver.name,
    plateNumber: vehicle.plateNumber,
    action: 'check_in',
  });

  sendSuccess(res, log, 201);
});

// ── PUT /daily-logs/:id/check-out — End session ──
export const checkOutDailyLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { endKm, endKmPhoto } = req.body;

  if (endKm === undefined) {
    sendError(res, 'endKm is required', 400);
    return;
  }

  const existing = await prisma.dailyVehicleLog.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 'Log not found', 404);
    return;
  }

  const endKmVal = parseFloat(String(endKm));

  // ⚠️ Fix #5: Validate endKm >= startKm
  if (existing.startKm !== null && endKmVal < existing.startKm) {
    sendError(res, `KM kết thúc (${endKmVal}) không thể nhỏ hơn KM bắt đầu (${existing.startKm})`, 400);
    return;
  }

  const totalKm = existing.startKm !== null ? endKmVal - existing.startKm : null;

  const log = await prisma.dailyVehicleLog.update({
    where: { id },
    data: {
      endKm: endKmVal,
      endKmPhoto: endKmPhoto || null,
      checkOutTime: new Date(),
      totalKm,
      status: 'completed',
    },
    include: {
      vehicle: { select: { id: true, plateNumber: true, type: true } },
      driver: { select: { id: true, name: true, code: true } },
      fuelEntries: true,
    },
  });

  // Trigger OCR cho đồng hồ KM kết thúc
  if (log.endKmPhoto && log.endKm) {
    OcrQueue.addJob('odometer_audit', {
      driverId: existing.driverId,
      vehicleId: existing.vehicleId,
      referenceId: log.id,
      documentType: 'odometer',
      imageUrl: log.endKmPhoto,
      declaredValue: log.endKm
    }).catch(console.error);
  }

  // Clear vehicle's active log, reset vehicle + driver status
  await Promise.all([
    prisma.vehicle.update({
      where: { id: existing.vehicleId },
      data: { activeLogId: null, status: 'available' },
    }),
    prisma.driver.update({
      where: { id: existing.driverId },
      data: { status: 'leave' },
    }).catch(() => {}), // non-critical
  ]);

  // Real-time: notify web app of vehicle release
  emitSocket(req, 'driver_vehicle_updated', {
    driverId: existing.driverId,
    driverName: existing.driverName,
    plateNumber: existing.plateNumber,
    action: 'check_out',
  });

  sendSuccess(res, log);
});

// ── POST /daily-logs/fuel — Add fuel entry to today's session ──
export const addFuelDailyLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    vehicleId, fuelKm, fuelKmPhoto,
    fuelCost, fuelCostPhoto,
    fuelPricePerLiter, fuelPricePhoto,
    fuelVolume, fuelNotes,
  } = req.body;

  if (!vehicleId) {
    sendError(res, 'vehicleId is required', 400);
    return;
  }

  const driver = await prisma.driver.findFirst({ where: { userId: req.user!.uid } });
  if (!driver) {
    sendError(res, 'Driver profile not found', 404);
    return;
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    sendError(res, 'Vehicle not found', 404);
    return;
  }

  // Find or create today's daily log for this vehicle
  const logDate = toLogDate();
  let dailyLog = await prisma.dailyVehicleLog.findUnique({
    where: { vehicleId_logDate: { vehicleId, logDate } },
  });

  if (!dailyLog) {
    // Auto-create a session log if none exists
    dailyLog = await prisma.dailyVehicleLog.create({
      data: {
        logDate,
        vehicleId,
        driverId: driver.id,
        plateNumber: vehicle.plateNumber,
        driverName: driver.name,
        status: 'active',
      },
    });
  }

  // ⚠️ Fix #5: Validate fuelKm range
  const fuelKmVal = fuelKm ? parseFloat(String(fuelKm)) : null;
  if (fuelKmVal !== null && dailyLog.startKm !== null && fuelKmVal < dailyLog.startKm) {
    sendError(res, `KM đổ xăng (${fuelKmVal}) không thể nhỏ hơn KM bắt đầu (${dailyLog.startKm})`, 400);
    return;
  }
  if (fuelKmVal !== null && dailyLog.endKm !== null && fuelKmVal > dailyLog.endKm) {
    sendError(res, `KM đổ xăng (${fuelKmVal}) vượt quá KM kết thúc (${dailyLog.endKm})`, 400);
    return;
  }

  // Create separate fuel entry (Fix #2: multi-fuel per day)
  const fuelEntry = await prisma.dailyFuelEntry.create({
    data: {
      dailyLogId: dailyLog.id,
      fuelKm: fuelKmVal,
      fuelKmPhoto: fuelKmPhoto || null,
      fuelCost: fuelCost ? parseFloat(String(fuelCost)) : null,
      fuelCostPhoto: fuelCostPhoto || null,
      fuelPricePerLiter: fuelPricePerLiter ? parseFloat(String(fuelPricePerLiter)) : null,
      fuelPricePhoto: fuelPricePhoto || null,
      fuelVolume: fuelVolume ? parseFloat(String(fuelVolume)) : null,
      fuelNotes: fuelNotes || null,
    },
    include: {
      dailyLog: {
        select: { id: true, plateNumber: true, driverName: true, logDate: true },
      },
    },
  });

  // Trigger OCR Audit Pipeline (Fire and forget)
  if (fuelEntry.fuelCostPhoto && fuelEntry.fuelCost) {
    OcrQueue.addJob('fuel_receipt_audit', {
      driverId: driver.id,
      vehicleId: vehicleId,
      referenceId: fuelEntry.id, // Reference to DailyFuelEntry
      documentType: 'fuel_receipt',
      imageUrl: fuelEntry.fuelCostPhoto,
      declaredValue: fuelEntry.fuelCost
    }).catch(console.error);
  }

  // Real-time: notify web app of fuel update
  emitSocket(req, 'driver_vehicle_updated', {
    driverId: driver.id,
    driverName: driver.name,
    plateNumber: vehicle.plateNumber,
    action: 'fuel_added',
  });

  sendSuccess(res, fuelEntry, 201);
});

// ── DELETE /daily-logs/:id — Admin delete log ──
export const deleteDailyLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.dailyVehicleLog.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 'Log not found', 404);
    return;
  }

  // Clear vehicle's active log if this was it
  if (existing.status === 'active') {
    await prisma.vehicle.update({
      where: { id: existing.vehicleId },
      data: { activeLogId: null },
    }).catch(() => {}); // ignore if vehicle was deleted
  }

  await prisma.dailyVehicleLog.delete({ where: { id } });
  sendSuccess(res, { message: 'Deleted' });
});
