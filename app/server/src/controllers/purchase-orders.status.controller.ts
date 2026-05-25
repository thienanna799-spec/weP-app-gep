import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { MaterialStatus } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { recordPurchaseOrderEvent } from '../services/orderTracking.service.js';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** PUT /api/purchase-orders/:id/submit — draft → pending_approval */
export const submitPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
  if (!po) { sendError(res, 'PO not found', 404); return; }
  if (po.status !== 'draft') { sendError(res, 'Chỉ có thể gửi duyệt đơn Nháp', 400); return; }

  const updated = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: {
      status: 'pending_approval',
    },
  });

  await recordPurchaseOrderEvent(po.id, {
    actionType: 'STATUS_CHANGE',
    action: 'Gửi duyệt',
    operator: req.user!.name || req.user!.uid,
    fromStatus: po.status,
    toStatus: 'pending_approval',
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
    },
  });

  await recordPurchaseOrderEvent(po.id, {
    actionType: 'APPROVE',
    action: 'Duyệt đơn mua hàng',
    operator: req.user!.name || req.user!.uid,
    fromStatus: po.status,
    toStatus: 'approved',
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
    },
  });

  await recordPurchaseOrderEvent(po.id, {
    actionType: 'STATUS_CHANGE',
    action: 'Đã đặt hàng nhà cung cấp',
    operator: req.user!.name || req.user!.uid,
    fromStatus: po.status,
    toStatus: 'ordered',
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
          data: { currentStock: newStock, status: status as MaterialStatus },
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
      },
    });

    await recordPurchaseOrderEvent(poId, {
      actionType: 'RECEIVE',
      action: allReceived ? 'Nhận hàng hoàn tất' : 'Nhận hàng một phần',
      operator: req.user!.name || req.user!.uid,
      fromStatus: po.status,
      toStatus: allReceived ? 'received' : 'partially_received',
      note: receivedItems.map(r => `Item ${r.purchaseOrderItemId}: +${r.receivedQty}`).join(', '),
      metadata: { receivedItems, allReceived }
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
    },
  });

  await recordPurchaseOrderEvent(po.id, {
    actionType: 'CANCEL',
    action: `Hủy đơn: ${reason || ''}`,
    operator: req.user!.name || req.user!.uid,
    fromStatus: po.status,
    toStatus: 'cancelled',
    note: reason,
  });
  sendSuccess(res, updated, 200, 'Đã hủy đơn mua hàng');
});
