import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { PurchaseOrderStatus } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { recordPurchaseOrderEvent } from '../services/orderTracking.service.js';
import { recordSystemAudit } from '../services/systemAudit.service.js';

/** GET /api/purchase-orders */
export const getPurchaseOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, supplierId } = req.query as { status?: string; supplierId?: string };
  const where: any = {};
  if (status && status !== 'All') {
    const statuses = status.split(',').map(s => s.trim());
    where.status = statuses.length === 1 ? statuses[0] as PurchaseOrderStatus : { in: statuses as PurchaseOrderStatus[] };
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
    },
    include: { items: true, supplier: { select: { name: true } } },
  });

  await recordPurchaseOrderEvent(po.id, {
    actionType: 'CREATE',
    action: 'Tạo đơn mua hàng',
    operator: req.user!.name || req.user!.uid,
    toStatus: po.status,
    metadata: { totalAmount, items }
  });

  await recordSystemAudit({
    userId: req.user!.uid,
    email: req.user!.email || 'system',
    action: 'CREATE',
    module: 'PROCUREMENT',
    referenceId: po.id,
    description: `${po.code} — NCC: ${po.supplier?.name || ''} — ${totalAmount.toLocaleString('vi-VN')}đ`,
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

  const oldPo = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  const po = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { ...data, totalAmount },
    include: { items: true },
  });

  await recordPurchaseOrderEvent(po.id, {
    actionType: 'UPDATE',
    action: 'Cập nhật đơn mua hàng',
    operator: req.user!.name || req.user!.uid,
    metadata: { updatedFields: Object.keys(data), before: oldPo }
  });

  sendSuccess(res, po, 200, 'Purchase order updated');
});

/** DELETE /api/purchase-orders/:id */
export const deletePurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (po.status !== 'draft') {
    sendError(res, 'Chỉ có thể xóa đơn Nháp', 400); return;
  }

  await recordSystemAudit({
    userId: req.user!.uid, email: req.user!.email || 'system', action: 'DELETE',
    module: 'PROCUREMENT', referenceId: po.id, description: `Xóa đơn mua hàng #${po.code}`,
    oldValue: po
  });

  await prisma.purchaseOrder.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 200, 'Đã xóa đơn mua hàng');
});
