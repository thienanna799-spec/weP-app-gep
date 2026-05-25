import { Router } from 'express';
import { requireAuth, requireActive } from '../middlewares/auth.middleware.js';
import { getShippingOrders, getShippingOrder, getShippingTracking, createShippingOrder, approveShippingOrder, updateShippingStatus, getShippingTimeline } from '../controllers/shipping.core.controller.js';
import { scanRollToShipping, assignDriver, logDeliveryAction, returnShipping } from '../controllers/shipping.dispatch.controller.js';
import { previewPickingSlip, downloadPickingSlipPDF, getPickingSlipData } from '../controllers/shipping.picking-slip.controller.js';

const router = Router();

// ── Shipping ────────────────────────────────────────────
router.get('/shipping', requireAuth, requireActive, getShippingOrders);
router.get('/shipping/:id', requireAuth, requireActive, getShippingOrder);
router.get('/shipping/:id/tracking', requireAuth, requireActive, getShippingTracking);
router.get('/shipping/:id/timeline', requireAuth, requireActive, getShippingTimeline);
router.post('/shipping', requireAuth, requireActive, createShippingOrder);
router.post('/shipping/:id/scan', requireAuth, requireActive, scanRollToShipping);
router.put('/shipping/:id/approve', requireAuth, requireActive, approveShippingOrder);
router.put('/shipping/:id/status', requireAuth, requireActive, updateShippingStatus);
router.put('/shipping/:id/assign-driver', requireAuth, requireActive, assignDriver);
router.post('/shipping/:id/delivery-log', requireAuth, requireActive, logDeliveryAction);
router.put('/shipping/:id/return', requireAuth, requireActive, returnShipping);
router.get('/shipping/:id/picking-slip/preview', requireAuth, requireActive, previewPickingSlip);
router.get('/shipping/:id/picking-slip/pdf', requireAuth, requireActive, downloadPickingSlipPDF);
router.get('/shipping/:id/picking-slip/data', requireAuth, requireActive, getPickingSlipData);

export default router;
