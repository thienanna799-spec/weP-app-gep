import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/** GET /api/admin/login-logs */
export const getLoginLogs = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const logs = await prisma.userLoginLog.findMany({
    orderBy: { loginAt: 'desc' },
    take: 100,
  });
  sendSuccess(res, logs);
});

/** POST /api/admin/login-logs */
export const createLoginLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, email, status } = req.body;
  const log = await prisma.userLoginLog.create({
    data: {
      userId,
      email,
      userAgent: req.headers['user-agent'] || '',
      status: status || 'success',
    },
  });
  sendSuccess(res, log, 201);
});

/** GET /api/admin/activity-logs */
export const getActivityLogs = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const logs = await prisma.userActivityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  sendSuccess(res, logs);
});

/** POST /api/admin/activity-logs */
export const createActivityLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, email, action, module, referenceId, description } = req.body;
  const log = await prisma.userActivityLog.create({
    data: { userId, email, action, module, referenceId, description },
  });
  sendSuccess(res, log, 201);
});

/** GET /api/admin/reports/overview */
export const getReportsOverview = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalOrders, totalMaterials, totalRolls, totalDrivers] = await prisma.$transaction([
    prisma.order.count(),
    prisma.material.count(),
    prisma.productRoll.count(),
    prisma.driver.count(),
  ]);

  const ordersByStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const rollsByStatus = await prisma.productRoll.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  sendSuccess(res, {
    totalOrders,
    totalMaterials,
    totalRolls,
    totalDrivers,
    ordersByStatus,
    rollsByStatus,
  });
});
