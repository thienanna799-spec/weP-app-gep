import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { emitSync } from './orders.core.controller.js';
import { autoSendInvoiceOnShipping } from '../invoice.controller.js';
import { sendDeliveryProofNotification, sendTelegramMessage } from '../../services/telegram.service.js';

/** PUT /api/orders/:id/approve */
export const approveOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) { sendError(res, 'Order not found', 404); return; }

  const inventoryToReserve: string[] = [];
  const batchDeductions: { batchId: string, quantity: number }[] = [];
  const missingItems: { productName: string, missing: number, unit: string }[] = [];

  for (const item of order.items) {
    const availableRolls = await prisma.productRoll.findMany({
      where: { productName: item.productName, specification: item.specification, status: 'trong_kho' },
      take: item.quantity,
    });

    if (availableRolls.length >= item.quantity) {
      inventoryToReserve.push(...availableRolls.map(r => r.id));
    } else {
      const neededFromBatch = item.quantity - availableRolls.length;
      const batchWhere: any = { tonKho: { gte: neededFromBatch } };
      if (item.subSku) batchWhere.subSku = item.subSku; else batchWhere.productName = item.productName;

      const batch = await prisma.importBatch.findFirst({ where: batchWhere, orderBy: { createdAt: 'desc' } });

      if (batch) {
        if (availableRolls.length > 0) inventoryToReserve.push(...availableRolls.map(r => r.id));
        batchDeductions.push({ batchId: batch.id, quantity: neededFromBatch });
      } else {
        missingItems.push({ productName: item.productName, missing: neededFromBatch, unit: item.unit || 'cuộn' });
      }
    }
  }

  if (missingItems.length > 0) {
    const msg = missingItems.map(m => `${m.productName} (thiếu ${m.missing} ${m.unit})`).join(', ');
    sendError(res, `Không đủ tồn kho: ${msg}. Vui lòng tạo Lệnh sản xuất!`, 400);
    return;
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (inventoryToReserve.length > 0) {
      await tx.productRoll.updateMany({ where: { id: { in: inventoryToReserve } }, data: { status: 'da_giu_cho_don', orderId: order.id } });
      const scanHistories = inventoryToReserve.map(id => ({ rollId: id, action: `Được giữ cho đơn hàng ${order.code}`, operator: req.user!.name }));
      await tx.rollScanHistory.createMany({ data: scanHistories });
    }

    for (const deduction of batchDeductions) {
      await tx.importBatch.update({
        where: { id: deduction.batchId },
        data: { xuatKho: { increment: deduction.quantity }, tonKho: { decrement: deduction.quantity } },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'da_duyet' as any, approvedBy: req.user!.uid, approvedByName: req.user!.name, approvedAt: new Date(),
        logs: { create: { action: 'Duyệt đơn hàng và giữ hàng', createdBy: req.user!.name || req.user!.email } },
      },
    });
  });

  emitSync(req, 'order_updated', { orderId: order.id, type: 'approved' });
  emitSync(req, 'inventory_updated', { orderId: order.id });
  sendSuccess(res, updatedOrder, 200, 'Order approved and inventory reserved');
});

/** PUT /api/orders/:id/reject */
export const rejectOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body as { reason?: string };
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'tu_choi' as any, note: reason, logs: { create: { action: 'Từ chối đơn hàng', note: reason, createdBy: req.user!.name || req.user!.email } } },
  });
  sendSuccess(res, order, 200, 'Order rejected');
});

/** PUT /api/orders/:id/cancel */
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body as { reason?: string };
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) { sendError(res, 'Order not found', 404); return; }

  if (['dang_giao', 'hoan_thanh'].includes(existing.status)) { sendError(res, 'Không thể hủy đơn hàng đã xuất kho hoặc hoàn thành', 400); return; }

  const order = await prisma.$transaction(async (tx) => {
    await tx.productRoll.updateMany({ where: { orderId: req.params.id }, data: { status: 'trong_kho' as any, orderId: null } });
    return tx.order.update({
      where: { id: req.params.id },
      data: { status: 'huy' as any, note: reason, logs: { create: { action: 'Hủy đơn hàng', note: reason, createdBy: req.user!.name || req.user!.email } } },
    });
  });

  emitSync(req, 'order_updated', { orderId: order.id, type: 'cancelled' });
  emitSync(req, 'inventory_updated', { orderId: order.id });
  sendSuccess(res, order, 200, 'Order cancelled');
});

/** PUT /api/orders/:id/status */
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status: string };
  const orderId = req.params.id;

  if (status === 'dang_giao') {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) { sendError(res, 'Order not found', 404); return; }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.subSku) continue;
        const batch = await tx.importBatch.findFirst({ where: { subSku: item.subSku }, orderBy: { createdAt: 'desc' } });
        if (batch) {
          await tx.importBatch.update({ where: { id: batch.id }, data: { xuatKho: { increment: item.quantity }, tonKho: { decrement: item.quantity } } });
        }
      }
      await tx.productRoll.updateMany({ where: { orderId: orderId, status: 'da_giu_cho_don' }, data: { status: 'da_xuat_kho' as any } });
    });
  } else if (status === 'huy') {
    await prisma.$transaction(async (tx) => {
      await tx.productRoll.updateMany({ where: { orderId: orderId, status: 'da_giu_cho_don' }, data: { status: 'trong_kho' as any, orderId: null } });
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as any, logs: { create: { action: `Cập nhật trạng thái: ${status}`, createdBy: req.user!.name || req.user!.email } } },
  });

  if (status === 'dang_giao') {
    autoSendInvoiceOnShipping(updatedOrder.id, req.user!.name || req.user!.email).catch(err => console.error('[Invoice] Auto-send failed:', err));
  }

  if (status === 'hoan_thanh') {
    (async () => {
      try {
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } });
        const chatId = order?.customer?.telegramChatId;
        if (chatId) {
          const proofs = await prisma.deliveryProof.findMany({ where: { orderId } });
          if (proofs.length > 0) {
            await sendDeliveryProofNotification(chatId, order.code, order.customerName, proofs.map(p => ({ fileType: p.fileType, fileUrl: p.fileUrl })));
          }
        }
      } catch (err) { console.error('[Telegram] Delivery proof notification failed:', err); }
    })();
  }

  (async () => {
    try {
      const o = await prisma.order.findUnique({ where: { id: orderId }, include: { customer: { select: { telegramChatId: true } } } });
      const chatId = o?.customer?.telegramChatId;
      if (!chatId) return;

      const statusMsgs: Record<string, string> = {
        dang_giao: `🚚 <b>Đơn hàng đang giao</b>\n\n📦 Mã: <code>${o.code}</code>\n👤 KH: <b>${o.customerName}</b>\n\nTài xế sẽ liên hệ quý khách sớm nhất.`,
        giao_that_bai: `⚠️ <b>Giao hàng thất bại</b>\n\n📦 Mã: <code>${o.code}</code>\n\nChúng tôi sẽ liên hệ để sắp xếp giao lại. Xin lỗi vì sự bất tiện!`,
        huy: `❌ <b>Đơn hàng đã hủy</b>\n\n📦 Mã: <code>${o.code}</code>\n\nNếu cần hỗ trợ, vui lòng liên hệ chúng tôi.`,
      };

      const msg = statusMsgs[status];
      if (!msg) return;

      const sent = await sendTelegramMessage(chatId, msg);
      await prisma.notificationLog.create({
        data: { type: 'order_status', channel: 'telegram', recipient: chatId, subject: `Đơn ${o.code} → ${status}`, content: msg, status: sent ? 'sent' : 'failed', relatedId: orderId, relatedType: 'order' },
      }).catch(() => {});
    } catch (err) { console.error('[Telegram] Status notification failed:', err); }
  })();

  emitSync(req, 'order_updated', { orderId: updatedOrder.id, type: 'status_change', status });
  if (status === 'dang_giao') emitSync(req, 'inventory_updated', { orderId: updatedOrder.id });
  sendSuccess(res, updatedOrder, 200, 'Status updated');
});
