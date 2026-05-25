import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial, getTransactions, createTransaction, getBOM, saveBOM } from '../controllers/materials.controller.js';
import { getProductionOrders, getProductionOrder, createProductionOrder, updateProductionOrder, updateProductionOrderStatus, deleteProductionOrder } from '../controllers/production-orders.controller.js';

const router = Router();

// ── Materials ───────────────────────────────────────────
router.get('/materials', requireAuth, requireActive, getMaterials);
router.get('/materials/transactions', requireAuth, requireActive, getTransactions);
router.post('/materials/transactions', requireAuth, requireActive, createTransaction);
router.get('/materials/bom/:productId', requireAuth, requireActive, getBOM);
router.post('/materials/bom', requireAuth, requireActive, saveBOM);
router.get('/materials/:id', requireAuth, requireActive, getMaterial);
router.post('/materials', requireAuth, requireActive, createMaterial);
router.put('/materials/:id', requireAuth, requireActive, updateMaterial);
router.delete('/materials/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteMaterial);

// ── Production Orders ───────────────────────────────────
router.get('/production-orders', requireAuth, requireActive, getProductionOrders);
router.get('/production-orders/:id', requireAuth, requireActive, getProductionOrder);
router.post('/production-orders', requireAuth, requireActive, createProductionOrder);
router.put('/production-orders/:id', requireAuth, requireActive, updateProductionOrder);
router.put('/production-orders/:id/status', requireAuth, requireActive, updateProductionOrderStatus);
router.delete('/production-orders/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteProductionOrder);

export default router;
