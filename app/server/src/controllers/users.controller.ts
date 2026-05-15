import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/** GET /api/users */
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  sendSuccess(res, users);
});

/** GET /api/users/:uid */
export const getUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { uid: req.params.uid } });
  if (!user) { sendError(res, 'User not found', 404); return; }
  sendSuccess(res, user);
});

/** PUT /api/users/:uid/role */
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body as { role: string };
  const user = await prisma.user.update({
    where: { uid: req.params.uid },
    data: { role: role as any },
  });

  // ── When admin approves role → driver, activate the Driver record ──
  if (role === 'driver') {
    await prisma.driver.updateMany({
      where: { userId: req.params.uid },
      data: { status: 'available' },
    });
  } else {
    // If role changed away from driver, deactivate Driver record
    await prisma.driver.updateMany({
      where: { userId: req.params.uid },
      data: { status: 'inactive' },
    });
  }

  // Activity log
  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid,
      email: req.user!.email,
      action: 'Thay đổi phân quyền',
      module: 'Quản lý tài khoản',
      referenceId: req.params.uid,
      description: `Cập nhật role thành ${role}`,
    },
  });

  // Notify web app for real-time refresh
  const io = req.app.get('io');
  if (io) io.emit('user_updated', { type: 'role_changed', uid: req.params.uid, role });

  sendSuccess(res, user, 200, 'Role updated');
});

/** PUT /api/users/:uid/status */
export const updateUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status: string };
  const user = await prisma.user.update({
    where: { uid: req.params.uid },
    data: { status: status as any },
  });

  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid,
      email: req.user!.email,
      action: status === 'blocked' ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      module: 'Quản lý tài khoản',
      referenceId: req.params.uid,
      description: `Trạng thái: ${status}`,
    },
  });

  // Notify web app for real-time refresh
  const io = req.app.get('io');
  if (io) io.emit('user_updated', { type: 'status_changed', uid: req.params.uid, status });

  sendSuccess(res, user, 200, 'Status updated');
});

/** DELETE /api/users/:uid */
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.user.delete({ where: { uid: req.params.uid } });
  sendSuccess(res, null, 200, 'User deleted');
});
