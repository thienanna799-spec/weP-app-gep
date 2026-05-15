import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { OcrQueue } from '../../services/ocr/queue/ocr.queue.js';

/** GET /api/fuel-logs?driverId= */
export const getFuelLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { driverId } = req.query as { driverId?: string };
  const logs = await prisma.fuelLog.findMany({
    where: driverId ? { driverId } : undefined,
    orderBy: { date: 'desc' },
  });
  sendSuccess(res, logs);
});

/** POST /api/fuel-logs */
export const addFuelLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, volume, mileage, notes, receiptUrl, date } = req.body;
  let { driverId } = req.body;

  if (!driverId) {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.uid } });
    if (!driver) { sendError(res, 'Không tìm thấy hồ sơ tài xế', 404); return; }
    driverId = driver.id;
  }

  if (!amount || Number(amount) <= 0) { sendError(res, 'Số tiền không hợp lệ', 400); return; }

  const log = await prisma.fuelLog.create({
    data: {
      driverId, userId: req.user!.uid, amount: Number(amount), volume: volume ? Number(volume) : 0,
      mileage: mileage ? Number(mileage) : 0, notes: notes || null, receiptUrl: receiptUrl || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  if (log.receiptUrl) {
    OcrQueue.addJob('fuel_receipt_audit', {
      driverId: log.driverId, vehicleId: log.vehicleId || undefined,
      referenceId: log.id, documentType: 'fuel_receipt', imageUrl: log.receiptUrl, declaredValue: log.amount
    }).catch(console.error);
  }

  sendSuccess(res, log, 201, 'Fuel log added');
});

/** POST /api/repair-logs */
export const addRepairLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { driverId, plateNumber, repairType, description, amount, mileage, shopName, damagePhotos, receiptPhoto, date } = req.body;

  let finalDriverId = driverId;
  if (!finalDriverId) {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.uid } });
    if (!driver) { sendError(res, 'Không tìm thấy hồ sơ tài xế', 404); return; }
    finalDriverId = driver.id;
  }

  if (!plateNumber) { sendError(res, 'Biển số xe là bắt buộc', 400); return; }

  let vehicle = await prisma.vehicle.findUnique({ where: { plateNumber } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        plateNumber, type: 'Xe tải', capacity: 0, year: new Date().getFullYear(), condition: 'Tốt',
        registrationDate: new Date().toISOString().split('T')[0], insuranceExpiry: new Date().toISOString().split('T')[0],
      }
    });
  }

  const notes = `${description || ''}${shopName ? ` (Tiệm: ${shopName})` : ''}`;
  const damagePhotoUrl = Array.isArray(damagePhotos) && damagePhotos.length > 0 ? damagePhotos[0] : null;

  const maint = await prisma.vehicleMaintenance.create({
    data: {
      vehicleId: vehicle.id, driverId: finalDriverId, date: date ? new Date(date) : new Date(),
      type: repairType || 'Sửa chữa', cost: Number(amount) || 0, mileage: Number(mileage) || 0,
      notes, receiptUrl: receiptPhoto || null, damagePhotoUrl, status: 'pending',
    },
  });

  sendSuccess(res, maint, 201, 'Repair log added');
});
