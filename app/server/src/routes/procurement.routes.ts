import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/suppliers.controller.js';
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from '../controllers/purchase-orders.core.controller.js';
import { submitPurchaseOrder, approvePurchaseOrder, markAsOrdered, receivePurchaseOrder, cancelPurchaseOrder } from '../controllers/purchase-orders.status.controller.js';
import { getLowStockMaterials, suggestPurchaseOrder, sendLowStockAlert } from '../controllers/purchase-orders.alerts.controller.js';

const router = Router();

// ── Suppliers ───────────────────────────────────────────
router.get('/suppliers', requireAuth, requireActive, getSuppliers);
router.get('/suppliers/:id', requireAuth, requireActive, getSupplier);
router.post('/suppliers', requireAuth, requireActive, requireRole('super_admin', 'admin'), createSupplier);
router.put('/suppliers/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), updateSupplier);
router.delete('/suppliers/:id', requireAuth, requireActive, requireRole('super_admin'), deleteSupplier);

// ── Purchase Orders ─────────────────────────────────────
router.get('/purchase-orders', requireAuth, requireActive, getPurchaseOrders);
router.get('/purchase-orders/:id', requireAuth, requireActive, getPurchaseOrder);
router.post('/purchase-orders', requireAuth, requireActive, requireRole('super_admin', 'admin'), createPurchaseOrder);
router.put('/purchase-orders/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), updatePurchaseOrder);
router.put('/purchase-orders/:id/submit', requireAuth, requireActive, requireRole('super_admin', 'admin'), submitPurchaseOrder);
router.put('/purchase-orders/:id/approve', requireAuth, requireActive, requireRole('super_admin', 'admin'), approvePurchaseOrder);
router.put('/purchase-orders/:id/order', requireAuth, requireActive, requireRole('super_admin', 'admin'), markAsOrdered);
router.put('/purchase-orders/:id/receive', requireAuth, requireActive, requireRole('super_admin', 'admin'), receivePurchaseOrder);
router.put('/purchase-orders/:id/cancel', requireAuth, requireActive, requireRole('super_admin', 'admin'), cancelPurchaseOrder);
router.delete('/purchase-orders/:id', requireAuth, requireActive, requireRole('super_admin'), deletePurchaseOrder);

// ── Materials: Suggest PO ───────────────────────────────
router.get('/materials/low-stock', requireAuth, requireActive, getLowStockMaterials);
router.post('/materials/:id/suggest-po', requireAuth, requireActive, requireRole('super_admin', 'admin'), suggestPurchaseOrder);
router.post('/materials/low-stock/alert', requireAuth, requireActive, requireRole('super_admin', 'admin'), sendLowStockAlert);

export default router;
