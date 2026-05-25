import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getLoginLogs, createLoginLog, getActivityLogs, createActivityLog, getReportsOverview } from '../controllers/admin.controller.js';
import { getPermissions, updatePermissions } from '../controllers/permissions.controller.js';
import { getReportSummary, getReportProduction, getReportMaterials, getReportInventory, getReportDelivery, getReportCustomers, exportReport, getReportFilterOptions } from '../controllers/reports.controller.js';
import { getNotifications, getNotificationStats } from '../controllers/returns.controller.js';
import { runOcrAudit } from '../controllers/ocr-webhook.controller.js';
import { getOcrAudits, getOcrAudit, reviewOcrAudit, getOcrAuditStats } from '../controllers/ocr-audit.controller.js';

const router = Router();

// ── Admin / Reports ─────────────────────────────────────
router.get('/admin/login-logs', requireAuth, requireActive, requireRole('super_admin', 'admin'), getLoginLogs);
router.post('/admin/login-logs', requireAuth, requireActive, createLoginLog);
router.get('/admin/activity-logs', requireAuth, requireActive, requireRole('super_admin', 'admin'), getActivityLogs);
router.post('/admin/activity-logs', requireAuth, requireActive, createActivityLog);
router.get('/admin/reports/overview', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReportsOverview);

// ── Permissions (role matrix) ───────────────────────────
router.get('/admin/permissions', requireAuth, requireActive, getPermissions);
router.put('/admin/permissions', requireAuth, requireActive, requireRole('super_admin'), updatePermissions);

// ── Reports & Analytics ─────────────────────────────────
router.get('/reports/filters', requireAuth, requireActive, getReportFilterOptions);
router.get('/reports/summary', requireAuth, requireActive, getReportSummary);
router.get('/reports/production', requireAuth, requireActive, getReportProduction);
router.get('/reports/materials', requireAuth, requireActive, getReportMaterials);
router.get('/reports/inventory', requireAuth, requireActive, getReportInventory);
router.get('/reports/delivery', requireAuth, requireActive, getReportDelivery);
router.get('/reports/customers', requireAuth, requireActive, getReportCustomers);
router.get('/reports/export/:type', requireAuth, requireActive, exportReport);

// ── Notifications ───────────────────────────────────────
router.get('/notifications/stats', requireAuth, requireActive, getNotificationStats);
router.get('/notifications', requireAuth, requireActive, getNotifications);

// ── Webhooks ────────────────────────────────────────────
// Note: Normally webhooks might have different auth, but we leave it open or require standard auth depending on caller
router.post('/webhooks/ocr/audit', runOcrAudit);

// ── OCR Audit Dashboard ──────────────────────────────────
router.get('/ocr-audit/stats', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOcrAuditStats);
router.get('/ocr-audit', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOcrAudits);
router.get('/ocr-audit/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOcrAudit);
router.patch('/ocr-audit/:id/review', requireAuth, requireActive, requireRole('super_admin', 'admin'), reviewOcrAudit);

export default router;
