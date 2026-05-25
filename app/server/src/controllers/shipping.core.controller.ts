import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ShippingStatus } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { recordOrderEvent, getOrderTimeline, statusLabel } from '../services/orderTracking.service.js';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/shipping?status= */
export const getShippingOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const orders = await prisma.shippingOrder.findMany({
    where: status && status !== 'All' ? { status: status as ShippingStatus } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  sendSuccess(res, orders);
});

/** GET /api/shipping/:id */
export const getShippingOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.shippingOrder.findUnique({
    where: { id: req.params.id },
    include: {
      items: true,
      deliveryLogs: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!order) { sendError(res, 'Shipping order not found', 404); return; }
  sendSuccess(res, order);
});

/** GET /api/shipping/:id/tracking — Full tracking data for delivery detail view */
export const getShippingTracking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shipping = await prisma.shippingOrder.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { roll: true } },
      deliveryLogs: { orderBy: { createdAt: 'asc' } },
      order: { include: { items: true, logs: { orderBy: { createdAt: 'asc' } } } },
    },
  });
  if (!shipping) { sendError(res, 'Shipping order not found', 404); return; }

  // Get driver GPS logs if driver is assigned
  let gpsLogs: any[] = [];
  if (shipping.assignedDriverId) {
    gpsLogs = await prisma.gpsLog.findMany({
      where: { driverId: shipping.assignedDriverId },
      orderBy: { timestamp: 'asc' },
      take: 500,
    });
  }

  // Get driver info
  let driver = null;
  if (shipping.assignedDriverId) {
    driver = await prisma.driver.findUnique({
      where: { id: shipping.assignedDriverId },
      select: { id: true, name: true, phone: true, code: true, status: true, avatar: true },
    });
  }

  sendSuccess(res, { ...shipping, gpsLogs, driver });
});

/** POST /api/shipping */
export const createShippingOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;
  
  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order) { sendError(res, 'Order not found', 404); return; }
  if (order.status !== 'da_duyet' && order.status !== 'dang_chuan_bi') {
    sendError(res, 'Chỉ có thể tạo phiếu xuất kho cho đơn hàng đã duyệt', 400); 
    return;
  }

  const newShippingOrder = await prisma.shippingOrder.create({
    data: {
      ...data,
      code: data.code || `SHIP-${Date.now().toString().slice(-6)}`,
      createdBy: req.user!.uid,
    },
  });

  // Automatically update order status to 'dang_chuan_bi' if it was 'da_duyet'
  if (order.status === 'da_duyet') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: ShippingStatus.dang_chuan_bi }
    });
  }

  // ── Audit: CREATE ──────────────────────
  await recordOrderEvent(newShippingOrder.id, {
    actionType: 'CREATE',
    action: `Tạo phiếu xuất kho ${newShippingOrder.code}`,
    operator: req.user!.name,
    toStatus: 'cho_xuat_kho',
    metadata: {
      orderId: data.orderId,
      customerName: newShippingOrder.customerName,
      totalRolls: newShippingOrder.totalRolls,
      createdBy: req.user!.uid,
    },
  });

  sendSuccess(res, newShippingOrder, 201, 'Shipping order created');
});

/** PUT /api/shipping/:id/approve */
export const approveShippingOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shippingId = req.params.id;
  const shipping = await prisma.shippingOrder.findUnique({ where: { id: shippingId } });
  if (!shipping) { sendError(res, 'Phiếu xuất kho không tồn tại', 404); return; }

  const fromStatus = String(shipping.status);

  // Approve means transition to dang_chuan_bi (ready for picking)
  const updated = await prisma.shippingOrder.update({
    where: { id: shippingId },
    data: { status: ShippingStatus.dang_chuan_bi },
  });

  await recordOrderEvent(shippingId, {
    actionType: 'APPROVE',
    action: `Phê duyệt phiếu ${shipping.code}`,
    operator: req.user!.name,
    fromStatus,
    toStatus: 'dang_chuan_bi',
  });

  emitSync(req, 'shipping_updated', { shippingId });
  sendSuccess(res, updated, 200, 'Đã phê duyệt phiếu xuất kho');
});

/** PUT /api/shipping/:id/status */
export const updateShippingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shippingId = req.params.id;
  const { status, note } = req.body as { status: string; note?: string };

  const shipping = await prisma.shippingOrder.findUnique({ where: { id: shippingId } });
  if (!shipping) { sendError(res, 'Phiếu xuất kho không tồn tại', 404); return; }

  const fromStatus = String(shipping.status);

  const updated = await prisma.shippingOrder.update({
    where: { id: shippingId },
    data: {
      status: status as ShippingStatus,
      ...(status === 'giao_thanh_cong' ? { deliveredAt: new Date() } : {}),
      ...(status === 'da_xuat_kho' ? { shippedAt: new Date() } : {}),
    },
  });

  await recordOrderEvent(shippingId, {
    actionType: 'STATUS_CHANGE',
    action: `Chuyển trạng thái: ${statusLabel(fromStatus)} → ${statusLabel(status)}`,
    operator: req.user!.name,
    fromStatus,
    toStatus: status,
    note: note || undefined,
    driverId: shipping.assignedDriverId || undefined,
    driverName: shipping.assignedDriverName || undefined,
    vehiclePlate: shipping.assignedVehicle || undefined,
  });

  emitSync(req, 'shipping_updated', { shippingId });
  sendSuccess(res, updated, 200, `Trạng thái đã cập nhật: ${statusLabel(status)}`);
});

/** GET /api/shipping/:id/timeline?start=&end= */
export const getShippingTimeline = asyncHandler(async (req: AuthRequest, res: Response) => {
  const events = await getOrderTimeline(req.params.id, {
    startDate: req.query.start as string,
    endDate: req.query.end as string,
  });
  sendSuccess(res, events);
});
