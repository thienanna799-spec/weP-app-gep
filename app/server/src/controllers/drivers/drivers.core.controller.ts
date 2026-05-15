import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';

function emitSocket(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/drivers */
export const getDrivers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const drivers = await prisma.driver.findMany({
    orderBy: { code: 'asc' },
    include: {
      vehicle: { select: { id: true, plateNumber: true, type: true } },
      dailyLogs: {
        where: { logDate: { gte: todayStart, lt: tomorrowStart }, status: 'active' },
        select: { plateNumber: true, vehicleId: true, checkInTime: true, status: true },
        take: 1, orderBy: { checkInTime: 'desc' },
      },
    },
  });

  const enriched = await Promise.all(drivers.map(async d => {
    const todayLog = d.dailyLogs?.[0] || null;
    let activeOrderCount = 0;
    let trustScore = 100;
    const fraudFlags = { duplicates: 0, rejected: 0, warnings: 0 };
    
    try {
      const [count, audits] = await Promise.all([
        prisma.shippingOrder.count({ where: { assignedDriverId: d.id, status: 'dang_giao' } }),
        prisma.ocrAuditLog.findMany({
          where: { driverId: d.id },
          select: { reviewStatus: true, fraudReason: true, riskLevel: true }
        })
      ]);
      activeOrderCount = count;
      audits.forEach(audit => {
        if (audit.reviewStatus === 'rejected') { trustScore -= 10; fraudFlags.rejected += 1; }
        if (audit.fraudReason === 'duplicate_receipt') { trustScore -= 20; fraudFlags.duplicates += 1; }
        if (audit.riskLevel === 'medium' && audit.reviewStatus !== 'approved') { trustScore -= 5; fraudFlags.warnings += 1; }
      });
      if (trustScore < 0) trustScore = 0;
    } catch { }

    let realStatus = d.status;
    if (!todayLog) {
      if (realStatus !== 'blocked' && realStatus !== 'inactive' && realStatus !== 'leave') {
        realStatus = 'leave';
        prisma.driver.update({ where: { id: d.id }, data: { status: 'leave' } }).catch(() => {});
      }
    } else {
      if (activeOrderCount > 0 && realStatus !== 'delivering') {
        realStatus = 'delivering';
        prisma.driver.update({ where: { id: d.id }, data: { status: 'delivering' } }).catch(() => {});
      } else if (activeOrderCount === 0 && realStatus === 'delivering') {
        realStatus = 'available';
        prisma.driver.update({ where: { id: d.id }, data: { status: 'available' } }).catch(() => {});
      }
    }

    return {
      ...d, status: realStatus, todayPlate: todayLog?.plateNumber || null,
      todayVehicleId: todayLog?.vehicleId || null, activeOrderCount, trustScore, fraudFlags, dailyLogs: undefined,
    };
  }));

  sendSuccess(res, enriched);
});

/** GET /api/drivers/leaderboard */
export const getDriverLeaderboard = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const drivers = await prisma.driver.findMany({
    where: { status: 'available' }, select: { id: true, name: true, code: true }
  });

  const enriched = await Promise.all(drivers.map(async d => {
    let trustScore = 100;
    const fraudFlags = { duplicates: 0, rejected: 0, warnings: 0 };
    try {
      const audits = await prisma.ocrAuditLog.findMany({
        where: { driverId: d.id }, select: { reviewStatus: true, fraudReason: true, riskLevel: true }
      });
      audits.forEach(audit => {
        if (audit.reviewStatus === 'rejected') { trustScore -= 10; fraudFlags.rejected += 1; }
        if (audit.fraudReason === 'duplicate_receipt') { trustScore -= 20; fraudFlags.duplicates += 1; }
        if (audit.riskLevel === 'medium' && audit.reviewStatus !== 'approved') { trustScore -= 5; fraudFlags.warnings += 1; }
      });
      if (trustScore < 0) trustScore = 0;
    } catch { }
    return { ...d, trustScore, fraudFlags };
  }));

  enriched.sort((a, b) => b.trustScore - a.trustScore);
  const topDrivers = enriched.slice(0, 5);
  const warningDrivers = enriched.filter(d => d.trustScore < 90).reverse().slice(0, 5);

  sendSuccess(res, { topDrivers, warningDrivers });
});

/** GET /api/drivers/:id */
export const getDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) { sendError(res, 'Driver not found', 404); return; }
  sendSuccess(res, driver);
});

/** POST /api/drivers */
export const createDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await prisma.driver.create({
    data: { ...req.body, code: req.body.code || `DRV-${Date.now().toString().slice(-6)}` },
  });
  emitSocket(req, 'driver_vehicle_updated', { action: 'driver_created', driverId: driver.id, driverName: driver.name });
  sendSuccess(res, driver, 201, 'Driver created');
});

/** PUT /api/drivers/:id */
export const updateDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await prisma.driver.update({ where: { id: req.params.id }, data: req.body });
  emitSocket(req, 'driver_vehicle_updated', { action: 'driver_updated', driverId: driver.id, driverName: driver.name });
  sendSuccess(res, driver, 200, 'Driver updated');
});

/** DELETE /api/drivers/:id */
export const deleteDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.driver.delete({ where: { id: req.params.id } });
  emitSocket(req, 'driver_vehicle_updated', { action: 'driver_deleted', driverId: req.params.id });
  sendSuccess(res, null, 200, 'Driver deleted');
});

/** GET /api/drivers/:id/stats */
export const getDriverStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driverId = req.params.id;
  const [totalDeliveries, successDeliveries, failedDeliveries] = await Promise.all([
    prisma.shippingOrder.count({ where: { assignedDriverId: driverId } }),
    prisma.shippingOrder.count({ where: { assignedDriverId: driverId, status: 'giao_thanh_cong' } }),
    prisma.shippingOrder.count({ where: { assignedDriverId: driverId, status: 'giao_that_bai' } }),
  ]);

  const fuelAgg = await prisma.fuelLog.aggregate({ where: { driverId }, _sum: { amount: true } });
  const lastGps = await prisma.gpsLog.findFirst({ where: { driverId }, orderBy: { timestamp: 'desc' }, select: { timestamp: true } });

  sendSuccess(res, {
    totalDeliveries, successDeliveries, failedDeliveries,
    successRate: totalDeliveries > 0 ? Math.round((successDeliveries / totalDeliveries) * 100) : 0,
    totalFuelCost: fuelAgg._sum.amount || 0,
    lastGpsTimestamp: lastGps?.timestamp || null,
  });
});
