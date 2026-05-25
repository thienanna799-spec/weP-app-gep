import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, getOrderItems, getOrderLogs } from '../controllers/orders/orders.core.controller.js';
import { approveOrder, rejectOrder, cancelOrder, updateOrderStatus } from '../controllers/orders/orders.status.controller.js';
import { updatePaymentStatus } from '../controllers/orders/orders.payment.controller.js';
import { pickRollToOrder, assignDriverToOrder, completeDelivery, failDelivery } from '../controllers/orders.dispatch.controller.js';
import { getDeliveryProofs, uploadDeliveryProof, deleteDeliveryProof, checkDeliveryProofs, upload } from '../controllers/delivery-proof.controller.js';
import { getContactLogs, createContactLog } from '../controllers/contact-logs.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createOrderSchema } from '../schemas/orders.schemas.js';

const router = Router();

// ── Orders ──────────────────────────────────────────────
router.get('/orders', requireAuth, requireActive, getOrders);
router.get('/orders/:id', requireAuth, requireActive, getOrder);
router.post('/orders', requireAuth, requireActive, validate(createOrderSchema), createOrder);
router.put('/orders/:id', requireAuth, requireActive, updateOrder);
router.put('/orders/:id/approve', requireAuth, requireActive, requireRole('super_admin', 'admin'), approveOrder);
router.put('/orders/:id/reject', requireAuth, requireActive, requireRole('super_admin', 'admin'), rejectOrder);
router.put('/orders/:id/cancel', requireAuth, requireActive, cancelOrder);
router.put('/orders/:id/status', requireAuth, requireActive, updateOrderStatus);
router.delete('/orders/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteOrder);
router.post('/orders/:id/pick-roll', requireAuth, requireActive, pickRollToOrder);
router.post('/orders/:id/assign-driver', requireAuth, requireActive, assignDriverToOrder);
router.post('/orders/:id/complete-delivery', requireAuth, requireActive, completeDelivery);
router.post('/orders/:id/fail-delivery', requireAuth, requireActive, failDelivery);
router.get('/orders/:id/items', requireAuth, requireActive, getOrderItems);
router.get('/orders/:id/logs', requireAuth, requireActive, getOrderLogs);
router.put('/orders/:id/payment-status', requireAuth, requireActive, updatePaymentStatus);
router.get('/orders/:id/delivery-proofs', requireAuth, requireActive, getDeliveryProofs);
router.post('/orders/:id/delivery-proofs', requireAuth, requireActive, upload.single('file'), uploadDeliveryProof);
router.delete('/orders/:id/delivery-proofs/:proofId', requireAuth, requireActive, deleteDeliveryProof);
router.get('/orders/:id/delivery-proofs/check', requireAuth, requireActive, checkDeliveryProofs);
router.get('/orders/:id/contact-logs', requireAuth, requireActive, getContactLogs);
router.post('/orders/:id/contact-logs', requireAuth, requireActive, createContactLog);

export default router;
