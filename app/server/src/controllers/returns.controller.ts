/**
 * Returns Controller
 * ──────────────────
 * Handles return requests: create, list, approve, resolve (refund/reship/cancel).
 * Integrated with Telegram notifications and Payment model for refunds.
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendTelegramMessage } from '../services/telegram.service.js';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

// ── Auto-generate return code ────────────────────────────
async function generateReturnCode(): Promise<string> {
  const last = await prisma.returnRequest.findFirst({ orderBy: { createdAt: 'desc' }, select: { code: true } });
  const num = last?.code ? parseInt(last.code.replace('RTN-', '')) + 1 : 1;
  return `RTN-${String(num).padStart(4, '0')}`;
}

// ── Log notification to DB ───────────────────────────────
async function logNotification(data: {
  type: string; channel?: string; recipient: string; subject: string;
  content: string; status?: string; relatedId?: string; relatedType?: string; error?: string;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        type: data.type,
        channel: data.channel || 'telegram',
        recipient: data.recipient,
        subject: data.subject,
        content: data.content,
        status: data.status || 'sent',
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        error: data.error,
      },
    });
  } catch (e) { console.error('[NotificationLog] Failed to save:', e); }
}

// ── GET /returns ─────────────────────────────────────────
export const getReturnRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, type } = req.query;
  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (type && type !== 'all') where.type = type;

  const returns = await prisma.returnRequest.findMany({
    where,
    include: {
      order: {
        select: {
          id: true, code: true, customerName: true, customerPhone: true,
          totalRevenue: true, paymentStatus: true, status: true,
          customer: { select: { id: true, name: true, telegramChatId: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, returns);
});

// ── GET /returns/stats ───────────────────────────────────
export const getReturnStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [total, pending, approved, processing, resolved, rejected] = await Promise.all([
    prisma.returnRequest.count(),
    prisma.returnRequest.count({ where: { status: 'pending' } }),
    prisma.returnRequest.count({ where: { status: 'approved' } }),
    prisma.returnRequest.count({ where: { status: 'processing' } }),
    prisma.returnRequest.count({ where: { status: 'resolved' } }),
    prisma.returnRequest.count({ where: { status: 'rejected' } }),
  ]);

  const totalRefund = await prisma.returnRequest.aggregate({
    _sum: { refundAmount: true },
    where: { status: 'resolved', resolution: 'refund' },
  });

  sendSuccess(res, {
    total, pending, approved, processing, resolved, rejected,
    totalRefundAmount: totalRefund._sum.refundAmount || 0,
  });
});

// ── POST /returns ────────────────────────────────────────
export const createReturnRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, shippingOrderId, type, reason } = req.body;
  if (!orderId || !type || !reason) {
    return sendError(res, 'orderId, type, reason là bắt buộc', 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: { select: { telegramChatId: true } } },
  });
  if (!order) return sendError(res, 'Đơn hàng không tồn tại', 404);

  // Check if there's already an active return for this order
  const existing = await prisma.returnRequest.findFirst({
    where: { orderId, status: { in: ['pending', 'approved', 'processing'] } },
  });
  if (existing) return sendError(res, `Đã có yêu cầu hoàn trả ${existing.code} đang xử lý`, 400);

  const code = await generateReturnCode();
  const rtn = await prisma.returnRequest.create({
    data: {
      code,
      orderId,
      shippingOrderId: shippingOrderId || undefined,
      type,
      reason,
      createdBy: req.user!.uid,
      createdByName: req.user!.name || req.user!.email,
    },
    include: { order: { select: { code: true, customerName: true } } },
  });

  // Notify customer via Telegram
  const chatId = order.customer?.telegramChatId;
  if (chatId) {
    const msg = `📋 <b>Yêu cầu hoàn trả đã được tạo</b>\n\n`
      + `📦 Đơn: <code>${order.code}</code>\n`
      + `🔖 Mã hoàn trả: <code>${code}</code>\n`
      + `📝 Lý do: ${reason}\n\n`
      + `<i>Chúng tôi sẽ xử lý trong thời gian sớm nhất.</i>`;
    const sent = await sendTelegramMessage(chatId, msg);
    await logNotification({
      type: 'return_update', recipient: chatId, subject: `Tạo RTN ${code}`,
      content: msg, status: sent ? 'sent' : 'failed',
      relatedId: orderId, relatedType: 'order',
    });
  }

  emitSync(req, 'return_updated', { returnId: rtn.id });
  sendSuccess(res, rtn, 201, 'Tạo yêu cầu hoàn trả thành công');
});

// ── PATCH /returns/:id/approve ───────────────────────────
export const approveReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const rtn = await prisma.returnRequest.findUnique({ where: { id } });
  if (!rtn) return sendError(res, 'Không tìm thấy RTN', 404);
  if (rtn.status !== 'pending') return sendError(res, 'Chỉ duyệt RTN ở trạng thái chờ', 400);

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: 'approved',
      processedBy: req.user!.uid,
      processedByName: req.user!.name || req.user!.email,
    },
  });

  emitSync(req, 'return_updated', { returnId: id });
  sendSuccess(res, updated, 200, 'Đã duyệt yêu cầu hoàn trả');
});

// ── PATCH /returns/:id/reject ────────────────────────────
export const rejectReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const rtn = await prisma.returnRequest.findUnique({ where: { id } });
  if (!rtn) return sendError(res, 'Không tìm thấy RTN', 404);
  if (!['pending', 'approved'].includes(rtn.status)) return sendError(res, 'Không thể từ chối RTN ở trạng thái này', 400);

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: 'rejected',
      refundNote: reason || 'Bị từ chối',
      processedBy: req.user!.uid,
      processedByName: req.user!.name || req.user!.email,
      resolvedAt: new Date(),
    },
  });

  emitSync(req, 'return_updated', { returnId: id });
  sendSuccess(res, updated, 200, 'Đã từ chối yêu cầu hoàn trả');
});

// ── PATCH /returns/:id/resolve ───────────────────────────
export const resolveReturn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { resolution, refundAmount, refundMethod, refundNote } = req.body;
  if (!resolution) return sendError(res, 'resolution là bắt buộc', 400);

  const rtn = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true, code: true, customerName: true, customerId: true, totalRevenue: true,
          paymentStatus: true, customerPhone: true, customerAddress: true, quantity: true,
          customer: { select: { telegramChatId: true } },
          items: true,
        },
      },
    },
  });
  if (!rtn) return sendError(res, 'Không tìm thấy RTN', 404);
  if (!['approved', 'processing'].includes(rtn.status)) {
    return sendError(res, 'RTN phải ở trạng thái đã duyệt hoặc đang xử lý', 400);
  }

  const updateData: any = {
    status: 'resolved',
    resolution,
    resolvedAt: new Date(),
    processedBy: req.user!.uid,
    processedByName: req.user!.name || req.user!.email,
  };

  // Handle refund
  if (resolution === 'refund' && refundAmount > 0) {
    const maxRefund = rtn.order.totalRevenue || 0;
    const actualRefund = Math.min(refundAmount, maxRefund);

    updateData.refundAmount = actualRefund;
    updateData.refundMethod = refundMethod || 'cash';
    updateData.refundNote = refundNote;
    updateData.refundedAt = new Date();

    // Create negative payment to reduce debt
    await prisma.payment.create({
      data: {
        orderId: rtn.orderId,
        amount: -actualRefund, // Negative = refund
        method: refundMethod || 'cash',
        reference: `Hoàn tiền ${rtn.code}`,
        note: refundNote || `Hoàn tiền theo RTN ${rtn.code}`,
        recordedBy: req.user!.uid,
        recordedByName: req.user!.name || req.user!.email,
      },
    });

    // Recalculate order paymentStatus
    const payments = await prisma.payment.findMany({ where: { orderId: rtn.orderId } });
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const newStatus = totalPaid >= (rtn.order.totalRevenue || 0) ? 'da_thanh_toan'
      : totalPaid > 0 ? 'thanh_toan_mot_phan' : 'chua_thanh_toan';
    await prisma.order.update({ where: { id: rtn.orderId }, data: { paymentStatus: newStatus } });
  }

  // Handle reship — create new order
  if (resolution === 'reship') {
    const o = rtn.order;
    const newOrder = await prisma.order.create({
      data: {
        code: `${o.code}-RS`,
        customerId: o.customerId,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        quantity: o.quantity,
        totalRevenue: 0, // No additional charge for reship
        status: 'nhap' as any,
        createdBy: req.user!.uid,
        createdByName: req.user!.name || req.user!.email,
        note: `Đơn giao lại từ RTN ${rtn.code} (đơn gốc: ${o.code})`,
      },
    });
    updateData.reshipOrderId = newOrder.id;
  }

  // ── Inventory Sync ───────────────────────────────────────
  // If resolution is refund or cancel, goods are returned to inventory (or marked as damaged)
  if (['refund', 'cancel'].includes(resolution)) {
    const rolls = await prisma.productRoll.findMany({ where: { orderId: rtn.orderId } });
    if (rolls.length > 0) {
      const newStatus = rtn.type === 'damaged' ? 'loi_hong' : 'trong_kho';
      
      await prisma.$transaction(async (tx) => {
        // Update rolls status and unassign from order
        await tx.productRoll.updateMany({
          where: { orderId: rtn.orderId },
          data: { status: newStatus as any, orderId: null },
        });

        // Restore tonKho for ImportBatch if any
        for (const r of rolls) {
          if (r.importBatchId && newStatus === 'trong_kho') {
            await tx.importBatch.update({
              where: { id: r.importBatchId },
              data: {
                tonKho: { increment: r.stockQuantity },
                xuatKho: { decrement: r.stockQuantity },
              },
            }).catch(() => {});
          }
        }
      });
      
      // Update the actual Order status to 'tra_hang' (Returned)
      await prisma.order.update({
        where: { id: rtn.orderId },
        data: { status: 'tra_hang' as any },
      }).catch(() => {});
      emitSync(req, 'inventory_updated', { source: 'return_resolved' });
    }
  }

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: updateData,
  });

  // Notify customer
  const chatId = rtn.order.customer?.telegramChatId;
  if (chatId) {
    const resLabel: Record<string, string> = {
      refund: `💰 Hoàn tiền: ${(updateData.refundAmount || 0).toLocaleString('vi-VN')}đ`,
      reship: '🚚 Giao lại đơn hàng mới',
      exchange: '🔄 Đổi hàng',
      cancel: '❌ Hủy đơn',
    };
    const msg = `✅ <b>Yêu cầu hoàn trả đã được giải quyết</b>\n\n`
      + `📦 Đơn: <code>${rtn.order.code}</code>\n`
      + `🔖 RTN: <code>${rtn.code}</code>\n`
      + `📌 Kết quả: ${resLabel[resolution] || resolution}\n\n`
      + `<i>Cảm ơn quý khách! — GEP Packaging 🌿</i>`;
    const sent = await sendTelegramMessage(chatId, msg);
    await logNotification({
      type: 'return_update', recipient: chatId, subject: `Giải quyết RTN ${rtn.code}`,
      content: msg, status: sent ? 'sent' : 'failed',
      relatedId: rtn.orderId, relatedType: 'order',
    });
  }

  emitSync(req, 'return_updated', { returnId: id });
  emitSync(req, 'order_updated', { type: 'return_resolved' });
  sendSuccess(res, updated, 200, 'Đã giải quyết yêu cầu hoàn trả');
});

// ── GET /notifications ───────────────────────────────────
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, limit } = req.query;
  const where: any = {};
  if (type && type !== 'all') where.type = type;

  const notifications = await prisma.notificationLog.findMany({
    where,
    orderBy: { sentAt: 'desc' },
    take: Number(limit) || 50,
  });

  sendSuccess(res, notifications);
});

// ── GET /notifications/stats ─────────────────────────────
export const getNotificationStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [total, sent, failed] = await Promise.all([
    prisma.notificationLog.count(),
    prisma.notificationLog.count({ where: { status: 'sent' } }),
    prisma.notificationLog.count({ where: { status: 'failed' } }),
  ]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.notificationLog.count({ where: { sentAt: { gte: today } } });

  sendSuccess(res, { total, sent, failed, today: todayCount });
});
