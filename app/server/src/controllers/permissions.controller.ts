import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const CONFIG_KEY = 'role_permissions';

// Default permission matrix — used when no DB override exists
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  dashboard:         ['super_admin', 'admin', 'staff'],
  customers:         ['super_admin', 'admin'],
  materials:         ['super_admin', 'admin', 'staff'],
  production_orders: ['super_admin', 'admin', 'staff'],
  production:        ['super_admin', 'admin', 'staff'],
  inventory:         ['super_admin', 'admin', 'staff'],
  products:          ['super_admin', 'admin', 'staff'],
  orders:            ['super_admin', 'admin', 'staff'],
  shipping:          ['super_admin', 'admin', 'staff'],
  drivers:           ['super_admin', 'admin'],
  reports:           ['super_admin', 'admin'],
  procurement:       ['super_admin', 'admin'],
  finance:           ['super_admin', 'admin'],
  admin:             ['super_admin'],
};

/**
 * GET /admin/permissions
 * Returns the current role_permissions config (or defaults).
 */
export const getPermissions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const config = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } });

  if (config) {
    try {
      const parsed = JSON.parse(config.value);
      return sendSuccess(res, parsed);
    } catch {
      // corrupted JSON — return defaults
    }
  }

  return sendSuccess(res, DEFAULT_PERMISSIONS);
});

/**
 * PUT /admin/permissions
 * Body: { permissions: { moduleId: [role1, role2, ...], ... } }
 * Only super_admin can update.
 */
export const updatePermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { permissions } = req.body;

  if (!permissions || typeof permissions !== 'object') {
    return sendError(res, 'Invalid permissions format', 400);
  }

  // Validate structure: each key is a moduleId, each value is an array of role strings
  const validRoles = ['super_admin', 'admin', 'staff', 'driver', 'pending'];
  const validModules = Object.keys(DEFAULT_PERMISSIONS);

  for (const [moduleId, roles] of Object.entries(permissions)) {
    if (!validModules.includes(moduleId)) {
      return sendError(res, `Unknown module: ${moduleId}`, 400);
    }
    if (!Array.isArray(roles)) {
      return sendError(res, `Roles for ${moduleId} must be an array`, 400);
    }
    for (const role of roles as string[]) {
      if (!validRoles.includes(role)) {
        return sendError(res, `Invalid role: ${role}`, 400);
      }
    }
  }

  // Safety: super_admin must ALWAYS have access to admin module
  if (permissions.admin && !permissions.admin.includes('super_admin')) {
    permissions.admin.push('super_admin');
  }

  // Safety: super_admin must always have access to all modules
  for (const moduleId of validModules) {
    if (!permissions[moduleId]) {
      permissions[moduleId] = ['super_admin'];
    } else if (!permissions[moduleId].includes('super_admin')) {
      permissions[moduleId].push('super_admin');
    }
  }

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: {
      key: CONFIG_KEY,
      value: JSON.stringify(permissions),
      updatedBy: req.user?.uid,
    },
    update: {
      value: JSON.stringify(permissions),
      updatedBy: req.user?.uid,
    },
  });

  // Notify all clients to reload permissions
  const io = req.app.get('io');
  if (io) io.emit('user_updated', { type: 'permissions_changed' });

  sendSuccess(res, permissions, 200, 'Permissions updated successfully');
});
