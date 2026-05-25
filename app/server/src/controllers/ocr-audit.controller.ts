import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditReviewStatus } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/**
 * GET /api/ocr-audit
 * Query: ?status=pending&risk=high&type=fuel_receipt&page=1&limit=20
 */
export const getOcrAudits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, risk, type, limit = '20', page = '1' } = req.query;

  const where: any = {};
  if (status && status !== 'all') where.reviewStatus = status;
  if (risk && risk !== 'all') where.riskLevel = risk;
  if (type && type !== 'all') where.documentType = type;

  const skip = (Number(page) - 1) * Number(limit);

  const [audits, total] = await Promise.all([
    prisma.ocrAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.ocrAuditLog.count({ where }),
  ]);

  // Enrich with driver info
  const enrichedAudits = await Promise.all(audits.map(async (audit) => {
    let driverInfo = null;
    try {
      const driver = await prisma.driver.findUnique({ where: { id: audit.driverId }, select: { name: true, code: true } });
      driverInfo = driver;
    } catch { /* silent */ }
    return { ...audit, driver: driverInfo };
  }));

  sendSuccess(res, {
    data: enrichedAudits,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    }
  });
});

/**
 * GET /api/ocr-audit/:id
 */
export const getOcrAudit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const audit = await prisma.ocrAuditLog.findUnique({
    where: { id: req.params.id }
  });

  if (!audit) {
    sendError(res, 'Audit log not found', 404);
    return;
  }

  let driver = null;
  try {
    driver = await prisma.driver.findUnique({ where: { id: audit.driverId } });
  } catch {}

  sendSuccess(res, { ...audit, driver });
});

/**
 * PATCH /api/ocr-audit/:id/review
 * Body: { status: 'approved' | 'rejected' | 'escalated', note?: string }
 */
export const reviewOcrAudit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!['approved', 'rejected', 'escalated'].includes(status)) {
    sendError(res, 'Invalid review status', 400);
    return;
  }

  const existing = await prisma.ocrAuditLog.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 'Audit not found', 404);
    return;
  }

  const updated = await prisma.ocrAuditLog.update({
    where: { id },
    data: { reviewStatus: status as AuditReviewStatus }
  });

  // Nếu Rejected, có thể tùy chỉnh: Trừ tiền tài xế, trừ FuelLog, hoặc tạo CustomerActivity (như 1 Task)
  if (status === 'rejected') {
    // Để giữ đơn giản cho Phase này, ta chỉ tạo Notification / Activity
    await prisma.notificationLog.create({
       data: {
         recipient: 'admin',
         type: 'system_alert',
         subject: 'Hóa đơn bị từ chối',
         content: `Hóa đơn OCR ID ${id} đã bị từ chối bởi ${req.user!.email}. Lý do: ${note || 'Gian lận'}`,
         status: 'sent'
       }
    });
  }

  sendSuccess(res, updated);
});

/**
 * GET /api/ocr-audit/stats
 * Lấy số lượng chờ duyệt
 */
export const getOcrAuditStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pendingCount = await prisma.ocrAuditLog.count({
    where: { reviewStatus: 'pending' }
  });

  const highRiskCount = await prisma.ocrAuditLog.count({
    where: { reviewStatus: 'pending', riskLevel: 'high' }
  });

  sendSuccess(res, { pending: pendingCount, highRisk: highRiskCount });
});
