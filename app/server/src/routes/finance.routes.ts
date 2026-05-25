import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getFinanceSummary, getReceivables, getCustomerReceivable, createPayment, getOrderPayments, getPayables, checkCredit, sendDebtAlerts } from '../controllers/finance.controller.js';
import { getReturnRequests, getReturnStats, createReturnRequest, approveReturn, rejectReturn, resolveReturn } from '../controllers/returns.controller.js';
import { previewInvoice, downloadInvoicePDF, getInvoiceData, sendInvoiceViaTelegram } from '../controllers/invoice.controller.js';

const router = Router();

// ── Finance ──────────────────────────────────────────
router.get('/finance/summary', requireAuth, requireActive, requireRole('super_admin', 'admin'), getFinanceSummary);
router.get('/finance/receivables', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReceivables);
router.get('/finance/receivables/:customerId', requireAuth, requireActive, requireRole('super_admin', 'admin'), getCustomerReceivable);
router.post('/finance/payments', requireAuth, requireActive, requireRole('super_admin', 'admin'), createPayment);
router.get('/finance/payments/:orderId', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOrderPayments);
router.get('/finance/payables', requireAuth, requireActive, requireRole('super_admin', 'admin'), getPayables);
router.get('/finance/credit-check/:customerId', requireAuth, requireActive, requireRole('super_admin', 'admin'), checkCredit);
router.post('/finance/debt-alerts', requireAuth, requireActive, requireRole('super_admin', 'admin'), sendDebtAlerts);

// ── Returns ─────────────────────────────────────────────
router.get('/returns/stats', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReturnStats);
router.get('/returns', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReturnRequests);
router.post('/returns', requireAuth, requireActive, requireRole('super_admin', 'admin'), createReturnRequest);
router.patch('/returns/:id/approve', requireAuth, requireActive, requireRole('super_admin', 'admin'), approveReturn);
router.patch('/returns/:id/reject', requireAuth, requireActive, requireRole('super_admin', 'admin'), rejectReturn);
router.patch('/returns/:id/resolve', requireAuth, requireActive, requireRole('super_admin', 'admin'), resolveReturn);

// ── Invoices ────────────────────────────────────────────
router.get('/invoices/:orderId/preview', requireAuth, requireActive, previewInvoice);
router.get('/invoices/:orderId/pdf', requireAuth, requireActive, downloadInvoicePDF);
router.get('/invoices/:orderId/data', requireAuth, requireActive, getInvoiceData);
router.post('/invoices/:orderId/send-telegram', requireAuth, requireActive, requireRole('super_admin', 'admin'), sendInvoiceViaTelegram);

export default router;
