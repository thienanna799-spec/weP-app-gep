import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';

function emitSocket(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** PUT /api/drivers/:id/location */
export const updateDriverLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { lat, lng } = req.body as { lat: number; lng: number };
  await prisma.gpsLog.create({
    data: { driverId: req.params.id, lat, lng },
  });
  emitSocket(req, 'driver_vehicle_updated', { action: 'gps_update', driverId: req.params.id, lat, lng });
  sendSuccess(res, null, 200, 'Location updated');
});

/** GET /api/drivers/:id/locations */
export const getDriverLocations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const locations = await prisma.gpsLog.findMany({
    where: { driverId: req.params.id },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  sendSuccess(res, locations);
});

/** GET /api/drivers/locations (all recent) */
export const getAllLocations = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const locations = await prisma.gpsLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  sendSuccess(res, locations);
});
