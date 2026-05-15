import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

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
      ...(status ? { status: status as any } : {}),
    },
    include: { 
      scanHistory: { orderBy: { timestamp: 'desc' } },
      order: { select: { code: true } }
    },
    orderBy: { productionDate: 'desc' },
  });
  sendSuccess(res, rolls);
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

/** POST /api/rolls */
export const createRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;
  const roll = await prisma.productRoll.create({
    data: {
      ...data,
      id: data.id || data.qrCode || `ROLL-${Date.now()}`,
      creator: req.user!.uid,
      productionDate: data.productionDate ? new Date(data.productionDate) : new Date(),
      scanHistory: {
        create: {
          action: 'Khởi tạo cuộn thành phẩm',
          operator: req.user!.name,
        },
      },
    },
    include: { scanHistory: true },
  });
  emitSync(req, 'inventory_updated', { rollId: roll.id });
  sendSuccess(res, roll, 201, 'Roll created');
});

/** PUT /api/rolls/:id/status */
export const updateRollStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, actionNote } = req.body as { status: string; actionNote?: string };
  const roll = await prisma.productRoll.update({
    where: { id: req.params.id },
    data: {
      status: status as any,
      scanHistory: {
        create: {
          action: actionNote || `Cập nhật trạng thái: ${status}`,
          operator: req.user!.name,
        },
      },
    },
  });
  emitSync(req, 'inventory_updated', { rollId: roll.id });
  sendSuccess(res, roll, 200, 'Roll status updated');
});

/** PUT /api/rolls/:id/scan-to-stock */
export const scanRollToStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quality } = req.body as { quality?: string };
  // quality: 'new' (default) | 'loi' | 'hong'
  const rollQuality = quality || 'new';
  const isDefective = rollQuality === 'loi' || rollQuality === 'hong';
  const statusToSet = isDefective ? 'loi_hong' : 'trong_kho';
  const qualityLabels: Record<string, string> = { new: 'Hàng mới (OK)', loi: 'Hàng lỗi', hong: 'Hàng hỏng' };
  const qualityLabel = qualityLabels[rollQuality] || 'Hàng mới (OK)';

  const roll = await prisma.productRoll.update({
    where: { id: req.params.id },
    data: {
      status: statusToSet as any,
      scanHistory: {
        create: {
          action: `Nhập kho — Phân loại: ${qualityLabel}`,
          operator: req.user!.name,
        },
      },
    },
  });
  emitSync(req, 'inventory_updated', { rollId: roll.id });
  sendSuccess(res, roll, 200, `Nhập kho: ${qualityLabel}`);
});

/** PUT /api/rolls/:id/ship */
export const shipRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.body as { orderId: string };
  const roll = await prisma.productRoll.update({
    where: { id: req.params.id },
    data: {
      status: 'da_xuat_kho' as any,
      orderId,
      scanHistory: {
        create: {
          action: `Xuất kho cho đơn hàng: ${orderId}`,
          operator: req.user!.name,
        },
      },
    },
  });
  emitSync(req, 'inventory_updated', { rollId: roll.id });
  emitSync(req, 'order_updated', { type: 'roll_shipped' });
  sendSuccess(res, roll, 200, 'Roll shipped');
});

/** PUT /api/rolls/:id/transfer */
export const transferRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { toPosition, reason, fromPosition } = req.body;
  await prisma.$transaction(async (tx) => {
    await tx.productRoll.update({
      where: { id: req.params.id },
      data: {
        positionWarehouse: toPosition.warehouse,
        positionArea: toPosition.area,
        positionShelf: toPosition.shelf,
        positionLayer: toPosition.layer,
        positionSlot: toPosition.slot,
        scanHistory: {
          create: {
            action: `Chuyển vị trí: ${fromPosition?.slot ?? 'N/A'} → ${toPosition.slot}`,
            operator: req.user!.name,
          },
        },
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
  