import { Router } from 'express';
import { requireAuth, requireActive } from '../middlewares/auth.middleware.js';
import { googleAuth, getMe } from '../controllers/auth.controller.js';

const router = Router();

// ── Health ──────────────────────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Auth ────────────────────────────────────────────────
router.post('/auth/google', googleAuth);
router.get('/me', requireAuth, requireActive, getMe);

export default router;
