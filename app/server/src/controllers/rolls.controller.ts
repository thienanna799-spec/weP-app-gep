import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { RollStatus } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { recordEvent, getRollTimeline as getTimeline, formatLocation, ActionType } from '../services/rollTracking.service.js';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/rolls?orderId=&productionOrderId=&status= */
export const getRolls = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, productionOrderId, status } = req.query as Record<string, string>;
  const rolls = await prisma.productRoll.findMany({
    where: {
      ...(orderId ? { orderId } : {}),
      ...(productionOrderId ? { productionOrderId } : {}),
      ...(status ? { status: status as RollStatus } : {}),
    },
    include: { 
      scanHistory: { orderBy: { timestamp: 'desc' } },
      order: { select: { code: true } }
    },
    orderBy: { productionDate: 'desc' },
  });
  sendSuccess(res, rolls);
});

/** DELETE /api/inventory/rolls/group?supplier=&subSku= */
export const deleteRollGroup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { supplier, subSku } = req.query as { supplier?: string; subSku?: string };

  if (!supplier || !subSku) {
    sendError(res, 'supplier and subSku are required', 400);
    return;
  }

  // Since ShippingOrderItem has onDelete: NoAction, delete them first to avoid foreign key constraints
  const rollsToDelete = await prisma.productRoll.findMany({
    where: { supplier, subSku },
    select: { id: true }
  });

  const rollIds = rollsToDelete.map(r => r.id);
  if (rollIds.length > 0) {
    await prisma.shippingOrderItem.deleteMany({
      where: { rollId: { in: rollIds } }
    });
  }

  // Delete all physical rolls for this group
  const result = await prisma.productRoll.deleteMany({
    where: { supplier, subSku },
  });

  // Also delete ImportBatch catalog entries so the row disappears from stock summary
  await prisma.importBatch.deleteMany({
    where: { supplier, subSku },
  });

  emitSync(req, 'inventory_updated', { type: 'group_deleted', supplier, subSku });
  sendSuccess(res, { count: result.count }, 200, 'Xóa sản phẩm thành công');
});

/** GET /api/rolls/history?subSku= */
export const getRollHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subSku } = req.query as Record<string, string>;
  if (!subSku) {
    sendError(res, 'subSku is required', 400);
    return;
  }

  // Lấy toàn bộ cuộn thuộc subSku này cùng lịch sử scan (đã enriched)
  const rolls = await prisma.productRoll.findMany({
    where: { subSku },
    include: {
      scanHistory: { orderBy: { timestamp: 'desc' } },
      shippingItems: {
        include: {
          shippingOrder: true
        }
      }
    }
  });

  // Flatten the history into a single timeline array
  const historyTimeline: any[] = [];

  rolls.forEach(roll => {
    roll.scanHistory.forEach(scan => {
      // Sử dụng trực tiếp dữ liệu enriched nếu có,
      // fallback về logic cũ cho dữ liệu lịch sử (trước migration)
      let customerName = scan.customerName || null;
      let driverName = scan.driverName || null;
      let orderCode = scan.orderCode || null;

      // Fallback: dữ liệu cũ chưa có enrichment
      if (!orderCode && !customerName) {
        if (scan.action.includes('Xuất kho theo phiếu')) {
          const match = scan.action.match(/SHIP-[A-Z0-9]+/);
          if (match) {
            const shipCode = match[0];
            orderCode = shipCode;
            const shipItem = roll.shippingItems.find(item => item.shippingOrder?.code === shipCode);
            if (shipItem && shipItem.shippingOrder) {
              customerName = shipItem.shippingOrder.customerName;
              driverName = shipItem.shippingOrder.assignedDriverName;
            }
          }
        } else if (scan.action.includes('Nhập kho') || scan.action.includes('Khởi tạo')) {
          if (roll.sourceType === 'manual' && (roll as any).importBatchId) {
            orderCode = `IMP-${(roll as any).importBatchId.slice(-6).toUpperCase()}`;
          } else if (roll.sourceType === 'production' && (roll as any).orderId) {
            orderCode = `SX-${(roll as any).orderId.slice(-6).toUpperCase()}`;
          }
        }
      }

      historyTimeline.push({
        id: scan.id,
        timestamp: scan.timestamp,
        qrCode: roll.qrCode,
        productName: roll.productName,
        subSku: roll.subSku,
        action: scan.action,
        actionType: scan.actionType || null,
        operator: scan.operator,
        customerName,
        driverName,
        orderCode,
        fromLocation: scan.fromLocation || null,
        toLocation: scan.toLocation || null,
        note: scan.note || null,
        sourceType: roll.sourceType,
      });
    });
  });

  // Sort timeline descending by timestamp
  historyTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  sendSuccess(res, historyTimeline);
});

/** GET /api/rolls/:id */
export const getRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const roll = await prisma.productRoll.findUnique({
    where: { id: req.params.id },
    include: {
      scanHistory: { orderBy: { timestamp: 'desc' } },
      movements: { orderBy: { timestamp: 'desc' } },
    },
  });
  if (!roll) { sendError(res, 'Roll not found', 404); return; }
  sendSuccess(res, roll);
});

/** GET /api/rolls/qr/:qrCode */
export const getRollByQR = asyncHandler(async (req: AuthRequest, res: Response) => {
  const roll = await prisma.productRoll.findUnique({
    where: { qrCode: req.params.qrCode },
    include: { scanHistory: { orderBy: { timestamp: 'desc' } } },
  });
  if (!roll) { sendError(res, 'QR code not found', 404); return; }
  sendSuccess(res, roll);
});

/** GET /api/rolls/qr/:qrCode/timeline?start=&end= */
export const getRollTimelineByQR = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { start, end } = req.query as { start?: string; end?: string };
  const result = await getTimeline(req.params.qrCode, {
    startDate: start,
    endDate: end,
  });
  if (!result) { sendError(res, 'QR code not found', 404); return; }
  sendSuccess(res, result);
});

/** POST /api/rolls */
export const createRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;
  const rollId = data.id || data.qrCode || `ROLL-${Date.now()}`;

  const roll = await prisma.productRoll.create({
    data: {
      ...data,
      id: rollId,
      creator: req.user!.uid,
      productionDate: data.productionDate ? new Date(data.productionDate) : new Date(),
    },
  });

  // Record lifecycle event
  await recordEvent(roll.id, {
    actionType: 'CREATE',
    action: 'Khởi tạo cuộn thành phẩm',
    operator: req.user!.name,
    orderCode: data.productionOrderId ? `SX-${data.productionOrderId.slice(-6).toUpperCase()}` : undefined,
    toLocation: formatLocation({
      warehouse: data.positionWarehouse,
      area: data.positionArea,
      shelf: data.positionShelf,
      layer: data.positionLayer,
      slot: data.positionSlot,
    }),
    metadata: {
      sourceType: data.sourceType || 'production',
      productName: data.productName,
      specification: data.specification,
      length: data.length,
      weight: data.weight,
    },
  });

  const rollWithHistory = await prisma.productRoll.findUnique({
    where: { id: roll.id },
    include: { scanHistory: true },
  });

  emitSync(req, 'inventory_updated', { rollId: roll.id });
  sendSuccess(res, rollWithHistory, 201, 'Roll created');
});

/** PUT /api/rolls/:id/status */
export const updateRollStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, actionNote } = req.body as { status: string; actionNote?: string };

  // Determine actionType based on status
  let actionType: ActionType = 'ADJUST';
  if (status === 'loi_hong') actionType = 'DAMAGE';
  else if (status === 'hoan_tra') actionType = 'RETURN';
  else if (status === 'trong_kho') actionType = 'IMPORT';
  else if (status === 'da_xuat_kho') actionType = 'EXPORT';

  const roll = await prisma.productRoll.update({
    where: { id: req.params.id },
    data: { status: status as RollStatus },
  });

  await recordEvent(roll.id, {
    actionType: actionType,
    action: actionNote || `Cập nhật trạng thái: ${status}`,
    operator: req.user!.name,
  });

  emitSync(req, 'inventory_updated', { rollId: roll.id });
  sendSuccess(res, roll, 200, 'Roll status updated');
});

/** PUT /api/rolls/:id/scan-to-stock */
export const scanRollToStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quality } = req.body as { quality?: string };
  const rollQuality = quality || 'new';
  const isDefective = rollQuality === 'loi' || rollQuality === 'hong';
  const statusToSet = isDefective ? 'loi_hong' : 'trong_kho';
  const qualityLabels: Record<string, string> = { new: 'Hàng mới (OK)', loi: 'Hàng lỗi', hong: 'Hàng hỏng' };
  const qualityLabel = qualityLabels[rollQuality] || 'Hàng mới (OK)';

  const roll = await prisma.productRoll.update({
    where: { id: req.params.id },
    data: { status: statusToSet as RollStatus },
  });

  await recordEvent(roll.id, {
    actionType: isDefective ? 'DAMAGE' : 'IMPORT',
    action: `Nhập kho — Phân loại: ${qualityLabel}`,
    operator: req.user!.name,
    metadata: { quality: rollQuality },
  });

  emitSync(req, 'inventory_updated', { rollId: roll.id });
  sendSuccess(res, roll, 200, `Nhập kho: ${qualityLabel}`);
});

/** PUT /api/rolls/:id/ship */
export const shipRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body as { orderId: string };

  // Get roll current location before shipping
  const currentRoll = await prisma.productRoll.findUnique({ where: { id: req.params.id } });
  const fromLoc = currentRoll ? formatLocation(currentRoll) : '—';

  const roll = await prisma.productRoll.update({
    where: { id: req.params.id },
    data: {
      status: RollStatus.da_xuat_kho,
      orderId,
    },
  });

  await recordEvent(roll.id, {
    actionType: 'EXPORT',
    action: `Xuất kho cho đơn hàng: ${orderId}`,
    operator: req.user!.name,
    orderCode: orderId,
    fromLocation: fromLoc,
  });

  emitSync(req, 'inventory_updated', { rollId: roll.id });
  emitSync(req, 'order_updated', { type: 'roll_shipped' });
  sendSuccess(res, roll, 200, 'Roll shipped');
});

/** PUT /api/rolls/:id/transfer */
export const transferRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { toPosition, reason, fromPosition } = req.body;

  const fromLoc = fromPosition ? formatLocation({
    warehouse: fromPosition.warehouse, area: fromPosition.area,
    shelf: fromPosition.shelf, layer: fromPosition.layer, slot: fromPosition.slot,
  }) : '—';
  const toLoc = formatLocation({
    warehouse: toPosition.warehouse, area: toPosition.area,
    shelf: toPosition.shelf, layer: toPosition.layer, slot: toPosition.slot,
  });

  await prisma.$transaction(async (tx) => {
    await tx.productRoll.update({
      where: { id: req.params.id },
      data: {
        positionWarehouse: toPosition.warehouse,
        positionArea: toPosition.area,
        positionShelf: toPosition.shelf,
        positionLayer: toPosition.layer,
        positionSlot: toPosition.slot,
      },
    });
    await tx.rollMovement.create({
      data: {
        rollId: req.params.id,
        fromWarehouse: fromPosition?.warehouse,
        fromArea: fromPosition?.area,
        fromShelf: fromPosition?.shelf,
        fromLayer: fromPosition?.layer,
        fromSlot: fromPosition?.slot,
        toWarehouse: toPosition.warehouse,
        toArea: toPosition.area,
        toShelf: toPosition.shelf,
        toLayer: toPosition.layer,
        toSlot: toPosition.slot,
        operator: req.user!.name,
        reason,
      },
    });
  });

  await recordEvent(req.params.id, {
    actionType: 'TRANSFER',
    action: `Chuyển vị trí: ${fromLoc} → ${toLoc}`,
    operator: req.user!.name,
    fromLocation: fromLoc,
    toLocation: toLoc,
    note: reason,
  });

  sendSuccess(res, null, 200, 'Roll transferred');
});

/** POST /api/rolls/inventory-check */
export const saveInventoryCheck = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { results, notes } = req.body;
  const check = await prisma.inventoryCheck.create({
    data: {
      operator: req.user!.name,
      notes,
      results: { create: results },
    },
    include: { results: true },
  });
  sendSuccess(res, check, 201, 'Inventory check saved');
});

/** GET /api/inventory/storage-capacity?zones=JSON */
export const getStorageCapacity = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Parse zone config from frontend (optional)
  let zonesConfig: { id: string; name: string; area: number }[] = [];
  try {
    if (req.query.zones) {
      zonesConfig = JSON.parse(req.query.zones as string);
    }
  } catch { /* ignore parse errors */ }

  const rolls = await prisma.productRoll.findMany({
    where: {
      status: {
        in: ['trong_kho', 'da_giu_cho_don']
      }
    },
    select: {
      height: true,
      positionArea: true
    }
  });

  const totalArea = req.query.total_area ? Number(req.query.total_area) : 500;
  const SLOT_AREA = req.query.slot_size ? Number(req.query.slot_size) : 0.36;
  const TOTAL_SLOTS = totalArea / SLOT_AREA;

  let totalSlotUsage = 0;
  const zoneSlotUsage: Record<string, { slots: number; rollCount: number }> = {};

  rolls.forEach(roll => {
    const h = roll.height || 1;
    // calculate slots
    let slots = 1;
    if (h > 1.2) slots = 2; // rough assumption: taller rolls take more slots
    totalSlotUsage += slots;

    const areaId = roll.positionArea || 'A1';
    if (!zoneSlotUsage[areaId]) {
      zoneSlotUsage[areaId] = { slots: 0, rollCount: 0 };
    }
    zoneSlotUsage[areaId].slots += slots;
    zoneSlotUsage[areaId].rollCount++;
  });

  const usedArea = totalSlotUsage * SLOT_AREA;
  
  const zones = Object.keys(zoneSlotUsage).map(id => {
    const z = zonesConfig.find(zc => zc.id === id);
    const zArea = z ? z.area : 100; // fallback 100m2
    const zUsed = zoneSlotUsage[id].slots * SLOT_AREA;
    return {
      id,
      name: z ? z.name : `Zone ${id}`,
      area: zArea,
      used_area: zUsed,
      roll_count: zoneSlotUsage[id].rollCount,
      usage_percent: Math.min((zUsed / zArea) * 100, 100)
    };
  });

  const response = {
    total_area: totalArea,
    used_area: usedArea,
    available_area: totalArea - usedArea,
    total_slots: TOTAL_SLOTS,
    used_slots: totalSlotUsage,
    usage_percent: Math.min((usedArea / totalArea) * 100, 100),
    zones
  };

  sendSuccess(res, response);
});