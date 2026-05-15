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

/** GET /api/purchase-orders */
export const getPurchaseOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, supplierId } = req.query as { status?: string; supplierId?: string };
  const where: any = {};
  if (status && status !== 'All') {
    const statuses = status.split(',').map(s => s.trim());
    where.status = statuses.length === 1 ? statuses[0] as any : { in: statuses as any[] };
  }
  if (supplierId) where.supplierId = supplierId;

  const orders = await prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      items: true,
      _count: { select: { items: true } },
    },
  });
  sendSuccess(res, orders);
});

/** GET /api/purchase-orders/:id */
export const getPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: {
      supplier: true,
      items: true,
      logs: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!po) { sendError(res, 'Purchase order not found', 404); return; }
  sendSuccess(res, po);
});

/** POST /api/purchase-orders */
export const createPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, ...data } = req.body;

  // Auto-generate code
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const dayCount = await prisma.purchaseOrder.count({
    where: { code: { startsWith: `PO-${today}` } },
  });
  const code = `PO-${today}-${String(dayCount + 1).padStart(3, '0')}`;

  // Calculate total
  const totalAmount = items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0) || 0;

  const po = await prisma.purchaseOrder.create({
    data: {
      ...data,
      code,
      totalAmount,
      createdBy: req.user!.uid,
      createdByName: req.user!.name,
      items: items?.length ? { create: items } : undefined,
      logs: {
        create: { action: 'Tạo đơn mua hàng', createdBy: req.user!.name || req.user!.email },
      },
    },
    include: { items: true, supplier: { select: { name: true } } },
  });

  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid,
      email: req.user!.email,
      action: 'Tạo đơn mua hàng',
      module: 'Procurement',
      referenceId: po.id,
      description: `${po.code} — NCC: ${po.supplier?.name || ''} — ${totalAmount.toLocaleString('vi-VN')}đ`,
    },
  });

  sendSuccess(res, po, 201, 'Purchase order created');
});

/** PUT /api/purchase-orders/:id */
export const updatePurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, ...data } = req.body;
  const poId = req.params.id;

  const existing = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!existing) { sendError(res, 'PO not found', 404); return; }
  if (existing.status !== 'draft') {
    sendError(res, 'Chỉ có thể sửa đơn mua hàng ở trạng thái Nháp', 400);
    return;
  }

  // Recalculate total if items provided
  let totalAmount = existing.totalAmount;
  if (items) {
    totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    // Replace all items
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: poId } });
    await prisma.purchaseOrderItem.createMany({
      data: items.map((item: any) => ({ ...item, purchaseOrderId: poId })),
    });
  }

  const po = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { ...data, totalAmount },
    include: { items: true },
  });
  sendSuccess(res, po, 200, 'Purchase order updated');
});

/** PUT /api/purchase-orders/:id/submit — draft → pending_approval */
export const submitPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (po.status !== 'draft') { sendError(res, 'Chỉ có thể gửi duyệt đơn Nháp', 400); return; }

  const updated = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      status: 'pending_approval',
      logs: { create: { action: 'Gửi duyệt', createdBy: req.user!.name || req.user!.email } },
    },
  });
  emitSync(req, 'procurement_updated', { poId: po.id, type: 'submitted' });
  sendSuccess(res, updated, 200, 'Đã gửi duyệt');
});

/** PUT /api/purchase-orders/:id/approve */
export const approvePurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (!['draft', 'pending_approval'].includes(po.status)) {
    sendError(res, 'Chỉ có thể duyệt đơn Nháp hoặc Chờ duyệt', 400); return;
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      status: 'approved',
      approvedBy: req.user!.uid,
      approvedByName: req.user!.name,
      approvedAt: new Date(),
      logs: { create: { action: 'Duyệt đơn mua hàng', createdBy: req.user!.name || req.user!.email } },
    },
  });
  emitSync(req, 'procurement_updated', { poId: po.id, type: 'approved' });
  sendSuccess(res, updated, 200, 'Đã duyệt đơn mua hàng');
});

/** PUT /api/purchase-orders/:id/order — approved → ordered */
export const markAsOrdered = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (po.status !== 'approved') { sendError(res, 'Chỉ có thể đặt hàng PO đã duyệt', 400); return; }

  const updated = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      status: 'ordered',
      logs: { create: { action: 'Đã đặt hàng nhà cung cấp', createdBy: req.user!.name || req.user!.email } },
    },
  });
  emitSync(req, 'procurement_updated', { poId: po.id, type: 'ordered' });
  sendSuccess(res, updated, 200, 'Đã đặt hàng NCC');
});

/** PUT /api/purchase-orders/:id/receive — Nhận hàng (từng phần hoặc toàn bộ) */
export const receivePurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const poId = req.params.id;
  const { items: receivedItems } = req.body as {
    items: { purchaseOrderItemId: string; receivedQty: number }[];
  };

  if (!receivedItems?.length) { sendError(res, 'Vui lòng chọn mặt hàng nhận', 400); return; }

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true, supplier: true },
  });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (!['ordered', 'partially_received'].includes(po.status)) {
    sendError(res, 'Chỉ có thể nhận hàng PO đã đặt hàng', 400); return;
  }

  await prisma.$transaction(async (tx) => {
    for (const received of receivedItems) {
      const poItem = po.items.find(i => i.id === received.purchaseOrderItemId);
      if (!poItem) continue;

      const newReceivedQty = poItem.receivedQty + received.receivedQty;

      // Update PO item received quantity
      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQty: newReceivedQty },
      });

      // Create MaterialTransaction (import)
      const txn = await tx.materialTransaction.create({
        data: {
          type: 'import',
          supplier: po.supplier?.name || '',
          operator: req.user!.name || req.user!.email,
          referenceId: po.code,
          notes: `Nhập từ PO ${po.code}`,
          items: {
            create: {
              materialId: poItem.materialId,
              materialName: poItem.materialName,
              quantity: received.receivedQty,
              unitPrice: poItem.unitPrice,
            },
          },
        },
      });

      // Update Material stock
      const material = await tx.material.findUnique({ where: { id: poItem.materialId } });
      if (material) {
        const newStock = material.currentStock + received.receivedQty;
        let status: string = 'con_hang';
        if (newStock <= 0) status = 'het_hang';
        else if (newStock <= material.minStock) status = 'sap_het';

        await tx.material.update({
          where: { id: material.id },
          data: { currentStock: newStock, status: status as any },
        });
      }
    }

    // Check if all items fully received
    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: poId } });
    const allReceived = updatedItems.every(item => item.receivedQty >= item.quantity);

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: allReceived ? 'received' : 'partially_received',
        receivedDate: allReceived ? new Date() : undefined,
        logs: {
          create: {
            action: allReceived ? 'Nhận hàng hoàn tất' : 'Nhận hàng một phần',
            note: receivedItems.map(r => `Item ${r.purchaseOrderItemId}: +${r.receivedQty}`).join(', '),
            createdBy: req.user!.name || req.user!.email,
          },
        },
      },
    });
  });

  emitSync(req, 'procurement_updated', { poId, type: 'received' });
  emitSync(req, 'inventory_updated', { source: 'procurement' });
  sendSuccess(res, null, 200, 'Nhận hàng thành công');
});

/** PUT /api/purchase-orders/:id/cancel */
export const cancelPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (['received', 'cancelled'].includes(po.status)) {
    sendError(res, 'Không thể hủy PO đã nhận hàng hoặc đã hủy', 400); return;
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      status: 'cancelled',
      logs: { create: { action: `Hủy đơn: ${reason || ''}`, createdBy: req.user!.name || req.user!.email } },
    },
  });
  sendSuccess(res, updated, 200, 'Đã hủy đơn mua hàng');
});

/** DELETE /api/purchase-orders/:id */
export const deletePurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (po.status !== 'draft') {
    sendError(res, 'Chỉ có thể xóa đơn Nháp', 400); return;
  }
  await prisma.purchaseOrder.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 200, 'Đã xóa đơn mua hàng');
});

/** GET /api/materials/low-stock — Danh sách NVL dưới mức tối thiểu */
export const getLowStockMaterials = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const materials = await prisma.material.findMany({
    where: {
      OR: [
        { status: 'sap_het' as any },
        { status: 'het_hang' as any },
      ],
    },
    orderBy: { currentStock: 'asc' },
    select: {
      id: true, code: true, name: true, group: true, unit: true,
      currentStock: true, minStock: true, purchasePrice: true, supplier: true,
    },
  });
  sendSuccess(res, materials);
});

/** POST /api/materials/low-stock/alert — Send low stock Telegram alert to staff */
export const sendLowStockAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const materials = await prisma.material.findMany({
    where: {
      OR: [
        { status: 'sap_het' as any },
        { status: 'het_hang' as any },
      ],
    },
    orderBy: { currentStock: 'asc' },
    select: { id: true, code: true, name: true, currentStock: true, minStock: true, unit: true },
  });

  if (materials.length === 0) {
    return sendSuccess(res, { alertsSent: 0, message: 'Không có NVL nào sắp hết' });
  }

  const chatId = process.env.TELEGRAM_STAFF_CHAT_ID;
  if (!chatId) {
    return sendSuccess(res, { alertsSent: 0, message: 'TELEGRAM_STAFF_CHAT_ID chưa được cấu hình' });
  }

  let msg = `⚠️ <b>Cảnh báo NVL sắp hết</b>\n\n`;
  for (const m of materials) {
    const emoji = m.currentStock <= 0 ? '🔴' : '🟡';
    msg += `${emoji} <b>${m.name}</b>: ${m.currentStock}/${m.minStock} ${m.unit}\n`;
  }
  msg += `\n📋 Tổng: ${materials.length} NVL cần bổ sung\n`;
  msg += `<i>Vui lòng tạo đơn mua hàng PO.</i>`;

  const sent = await sendTelegramMessage(chatId, msg);

  // Log notification
  try {
    await prisma.notificationLog.create({
      data: {
        type: 'low_stock', channel: 'telegram', recipient: chatId,
        subject: `Cảnh báo ${materials.length} NVL sắp hết`,
        content: msg, status: sent ? 'sent' : 'failed',
        relatedType: 'material',
      },
    });
  } catch { /* ignore */ }

  sendSuccess(res, { alertsSent: sent ? 1 : 0, materialCount: materials.length, message: sent ? 'Đã gửi cảnh báo NVL' : 'Gửi thất bại' });
});

/** POST /api/materials/:id/suggest-po — Tự động tạo PO draft từ NVL */
export const suggestPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const material = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!material) { sendError(res, 'Material not found', 404); return; }

  // Find supplier
  let supplier = null;
  if (material.supplier) {
    supplier = await prisma.supplier.findFirst({
      where: { name: { contains: material.supplier }, isActive: true },
    });
  }

  // Calculate suggested quantity: (minStock * 2) - currentStock
  const suggestedQty = Math.max(material.minStock * 2 - material.currentStock, material.minStock);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const dayCount = await prisma.purchaseOrder.count({
    where: { code: { startsWith: `PO-${today}` } },
  });
  const code = `PO-${today}-${String(dayCount + 1).padStart(3, '0')}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      code,
      supplierId: supplier?.id || '',
      totalAmount: suggestedQty * material.purchasePrice,
      createdBy: req.user!.uid,
      createdByName: req.user!.name,
      notes: `Tự động đề xuất: ${material.name} đang ở mức ${material.currentStock}/${material.minStock}`,
      items: {
        create: {
          materialId: material.id,
          materialName: material.name,
          quantity: suggestedQty,
          unitPrice: material.purchasePrice,
          unit: material.unit,
        },
      },
      logs: {
        create: { action: 'Tự động tạo PO từ cảnh báo NVL sắp hết', createdBy: req.user!.name || 'System' },
      },
    },
    include: { items: true },
  });

  sendSuccess(res, po, 201, `Đã tạo PO gợi ý cho ${material.name}`);
});
