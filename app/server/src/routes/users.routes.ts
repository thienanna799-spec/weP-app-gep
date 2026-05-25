import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getUsers, getUser, updateUserRole, updateUserStatus, deleteUser } from '../controllers/users.controller.js';

const router = Router();

// ── Users ───────────────────────────────────────────────
router.get('/users', requireAuth, requireActive, requireRole('super_admin', 'admin'), getUsers);
router.get('/users/:uid', requireAuth, requireActive, getUser);
router.put('/users/:uid/role', requireAuth, requireActive, requireRole('super_admin', 'admin'), updateUserRole);
router.put('/users/:uid/status', requireAuth, requireActive, requireRole('super_admin', 'admin'), updateUserStatus);
router.delete('/users/:uid', requireAuth, requireActive, requireRole('super_admin'), deleteUser);

export default router;
