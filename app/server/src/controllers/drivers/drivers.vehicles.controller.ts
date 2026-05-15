import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';

function emitSocket(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/vehicles */
export const getVehicles = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { plateNumber: 'asc' },
    include: {
      dailyLogs: {
        where: { logDate: { gte: todayStart, lt: tomorrowStart } },
        select: { driverName: true, driverId: true, status: true, checkInTime: true, plateNumber: true },
        take: 1, orderBy: { checkInTime: 'desc' },
      },
    },
  });

  const fixPromises: Promise<any>[] = [];
  const enriched = vehicles.map((v) => {
    const todayLog = v.dailyLogs?.[0] || null;
    const isActiveToday = todayLog?.status === 'active';

    let realStatus = v.status;
    if (v.status === 'in_use' && !isActiveToday) {
      fixPromises.push(
        prisma.vehicle.update({
          where: { id: v.id }, data: { status: 'available', activeLogId: null },
        }).catch(() => {})
      );
      realStatus = 'available';
    }

    return {
      ...v, status: realStatus,
      activeDriverName: isActiveToday ? todayLog!.driverName : null,
      activeDriverId: isActiveToday ? todayLog!.driverId : null,
      activeCheckIn: isActiveToday ? todayLog!.checkInTime : null,
      dailyLogs: undefined,
    };
  });

  if (fixPromises.length > 0) {
    Promise.all(fixPromises).catch(() => {});
  }

  sendSuccess(res, enriched);
});

/** GET /api/vehicles/:id */
export const getVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) { sendError(res, 'Vehicle not found', 404); return; }
  sendSuccess(res, vehicle);
});

/** POST /api/vehicles */
export const createVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { plateNumber, type, capacity, year, condition, registrationDate, insuranceExpiry, currentMileage, status, notes } = req.body;
  if (!plateNumber) { sendError(res, 'Biển số xe là bắt buộc', 400); return; }
  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber, type: type || 'Xe tải', capacity: parseFloat(capacity) || 0,
      year: parseInt(year) || new Date().getFullYear(), condition: condition || 'Tốt',
      registrationDate: registrationDate || new Date().toISOString().split('T')[0],
      insuranceExpiry: insuranceExpiry || new Date().toISOString().split('T')[0],
      currentMileage: parseFloat(currentMileage) || 0,
      ...(status && { status }), ...(notes && { notes }),
    },
  });
  emitSocket(req, 'driver_vehicle_updated', { action: 'vehicle_created', vehicleId: vehicle.id, plateNumber: vehicle.plateNumber });
  sendSuccess(res, vehicle, 201, 'Vehicle created');
});

/** PUT /api/vehicles/:id */
export const updateVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { plateNumber, type, capacity, year, condition, registrationDate, insuranceExpiry, currentMileage, status, notes } = req.body;
  const data: any = {};
  if (plateNumber !== undefined) data.plateNumber = plateNumber;
  if (type !== undefined) data.type = type;
  if (capacity !== undefined) data.capacity = parseFloat(capacity) || 0;
  if (year !== undefined) data.year = parseInt(year) || new Date().getFullYear();
  if (condition !== undefined) data.condition = condition;
  if (registrationDate !== undefined) data.registrationDate = registrationDate;
  if (insuranceExpiry !== undefined) data.insuranceExpiry = insuranceExpiry;
  if (currentMileage !== undefined) data.currentMileage = parseFloat(currentMileage) || 0;
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;

  const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
  emitSocket(req, 'driver_vehicle_updated', { action: 'vehicle_updated', vehicleId: vehicle.id, plateNumber: vehicle.plateNumber });
  sendSuccess(res, vehicle, 200, 'Vehicle updated');
});

/** GET /api/vehicles/:id/maintenances */
export const getVehicleMaintenances = asyncHandler(async (req: AuthRequest, res: Response) => {
  const maintenances = await prisma.vehicleMaintenance.findMany({
    where: { vehicleId: req.params.id }, orderBy: { date: 'desc' },
  });
  sendSuccess(res, maintenances);
});

/** POST /api/vehicles/:id/maintenances */
export const addVehicleMaintenance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const maint = await prisma.vehicleMaintenance.create({
    data: { ...req.body, vehicleId: req.params.id, date: req.body.date ? new Date(req.body.date) : new Date() },
  });
  sendSuccess(res, maint, 201, 'Maintenance added');
});

/** GET /api/maintenances — All vehicle maintenances */
export const getAllMaintenances = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const maintenances = await prisma.vehicleMaintenance.findMany({ orderBy: { date: 'desc' } });
  sendSuccess(res, maintenances);
});
