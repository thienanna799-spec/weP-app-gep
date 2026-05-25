import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { recordProductionEvent } from '../services/productionTracking.service.js';
import { recordSystemAudit } from '../services/systemAudit.service.js';

/** GET /api/production-orders */
export const getProductionOrders = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const pos = await prisma.productionOrder.findMany({
    include: { 
      materials: true,
      _count: { select: { rolls: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Compute good-rolls count (exclude loi_hong) for each production order
  const poIds = pos.map(po => po.id);
  const goodCounts = await prisma.productRoll.groupBy({
    by: ['productionOrderId'],
    where: {
      productionOrderId: { in: poIds },
      status: { not: 'loi_hong' },
    },
    _count: true,
  });
  const defectCounts = await prisma.productRoll.groupBy({
    by: ['productionOrderId'],
    where: {
      productionOrderId: { in: poIds },
      status: 'loi_hong',
    },
    _count: true,
  });

  const goodMap = new Map(goodCounts.map(g => [g.productionOrderId, g._count]));
  const defectMap = new Map(defectCounts.map(d => [d.productionOrderId, d._count]));

  const result = pos.map(po => ({
    ...po,
    _goodRolls: goodMap.get(po.id) ?? 0,
    _defectRolls: defectMap.get(po.id) ?? 0,
  }));

  sendSuccess(res, result);
});

/** GET /api/production-orders/:id */
export const getProductionOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.productionOrder.findUnique({
    where: { id: req.params.id },
    include: { materials: true, rolls: true },
  });
  if (!po) { sendError(res, 'Production order not found', 404); return; }
  sendSuccess(res, po);
});

/** POST /api/production-orders */
export const createProductionOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { materials, creatorName, personInChargeName, ...rest } = req.body;

  // Build only fields that exist in the Prisma schema
  const createData: any = {
    code: rest.code || `LSX-${Date.now().toString().slice(-8)}`,
    creatorId: req.user!.uid,
    productionDate: rest.productionDate ? new Date(rest.productionDate) : new Date(),
    requiredQuantity: Number(rest.requiredQuantity) || 0,
    specs: rest.specs || '',
    status: rest.status || 'waiting_material',
    targetRolls: Number(rest.targetRolls) || 0,
    rollLength: Number(rest.rollLength) || 0,
    rollWeight: Number(rest.rollWeight) || 0,
  };

  // Optional fields
  if (rest.productName) createData.productName = rest.productName;
  if (rest.machineArea) createData.machineArea = rest.machineArea;
  if (rest.notes) createData.notes = rest.notes;
  if (rest.deadline) createData.deadline = new Date(rest.deadline);
  if (rest.orderId) createData.orderId = rest.orderId;
  if (rest.consumptionRate) createData.consumptionRate = rest.consumptionRate;
  if (rest.personInChargeId) createData.personInChargeId = rest.personInChargeId;

  // Materials relation
  if (materials?.length) {
    createData.materials = { create: materials };
  }

  const po = await prisma.productionOrder.create({
    data: createData,
    include: { materials: true },
  });

  // ── Record Event ──────────────────────────────────────────
  await recordProductionEvent(po.id, {
    actionType: 'CREATE',
    action: `Tạo lệnh sản xuất ${po.code}`,
    operator: req.user?.name || req.user!.uid,
    toStatus: po.status,
    metadata: { targetRolls: po.targetRolls, specs: po.specs },
  });

  // ── Procurement Auto-PO ─────────────────────────────────
  if (materials?.length) {
    for (const mat of materials) {
      if (!mat.materialId) continue;
      
      const dbMat = await prisma.material.findUnique({ where: { id: mat.materialId } });
      if (!dbMat) continue;
      
      const required = Number(mat.requiredQty) || 0;
      if (dbMat.currentStock < required) {
        // Find supplier
        let supplierId = '';
        if (dbMat.supplier) {
          const sup = await prisma.supplier.findFirst({ where: { name: { contains: dbMat.supplier }, isActive: true } });
          if (sup) supplierId = sup.id;
        }

        const missing = required - dbMat.currentStock;
        const suggestedQty = Math.max(missing, dbMat.minStock);

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const dayCount = await prisma.purchaseOrder.count({ where: { code: { startsWith: `PO-${today}` } } });
        const poCode = `PO-${today}-${String(dayCount + 1).padStart(3, '0')}`;

        await prisma.purchaseOrder.create({
          data: {
            code: poCode,
            supplierId,
            totalAmount: suggestedQty * dbMat.purchasePrice,
            createdBy: req.user!.uid,
            createdByName: req.user!.name || 'System',
            notes: `Tự động tạo: Thiếu ${missing} ${dbMat.unit} cho Lệnh sản xuất ${po.code}`,
            items: {
              create: {
                materialId: dbMat.id,
                materialName: dbMat.name,
                quantity: suggestedQty,
                unitPrice: dbMat.purchasePrice,
                unit: dbMat.unit,
              },
            },
            logs: {
              create: { action: `Tự động tạo PO từ LSX ${po.code}`, createdBy: 'System' },
            },
          },
        });
      }
    }
  }

  sendSuccess(res, po, 201, 'Production order created');
});

/** PUT /api/production-orders/:id */
export const updateProductionOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { materials, ...data } = req.body;
  const oldPo = await prisma.productionOrder.findUnique({ where: { id: req.params.id } });

  const po = await prisma.productionOrder.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(data.productionDate ? { productionDate: new Date(data.productionDate) } : {}),
    },
    include: { materials: true },
  });

  await recordProductionEvent(po.id, {
    actionType: 'UPDATE',
    action: `Cập nhật thông tin lệnh sản xuất`,
    operator: req.user?.name || req.user!.uid,
    metadata: { 
      updatedFields: Object.keys(data),
      targetRolls: po.targetRolls 
    },
  });

  sendSuccess(res, po, 200, 'Production order updated');
});

/** PUT /api/production-orders/:id/status */
export const updateProductionOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body as { status: string };
  const data: any = { status };

  // Record completion time when marking as completed, clear it otherwise
  if (status === 'completed') {
    data.completedAt = new Date();
  } else {
    data.completedAt = null;
  }

  const oldPo = await prisma.productionOrder.findUnique({ where: { id: req.params.id } });

  const po = await prisma.productionOrder.update({
    where: { id: req.params.id },
    data,
  });

  const actionTypeMap: Record<string, any> = {
    cancelled: 'CANCEL',
    completed: 'COMPLETE',
    producing: 'START'
  };

  await recordProductionEvent(po.id, {
    actionType: actionTypeMap[status] || 'OTHER',
    action: `Cập nhật trạng thái lệnh sản xuất`,
    operator: req.user?.name || req.user!.uid,
    fromStatus: oldPo?.status,
    toStatus: po.status,
  });

  // When cancelling, reset linked order back to 'da_duyet' so it re-appears in queue
  if (status === 'cancelled' && po.orderId) {
    await prisma.order.update({
      where: { id: po.orderId },
      data: { status: 'da_duyet' },
    }).catch(() => { /* order may not exist or already in correct status */ });
  }

  sendSuccess(res, po, 200, 'Status updated');
});

/** DELETE /api/production-orders/:id */
export const deleteProductionOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const po = await prisma.productionOrder.findUnique({ where: { id: req.params.id } });
  if (po) {
    await recordSystemAudit({
      userId: req.user!.uid,
      email: req.user!.email || 'system',
      action: 'DELETE',
      module: 'PRODUCTION_ORDER',
      referenceId: po.id,
      description: `Xóa lệnh sản xuất ${po.code}`,
      oldValue: po
    });
  }
  await prisma.productionOrder.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 200, 'Production order deleted');
});
