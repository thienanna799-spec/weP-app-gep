import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';

export function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/orders */
export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  let where: any = undefined;
  if (status && status !== 'All') {
    const statuses = status.split(',').map(s => s.trim());
    where = statuses.length === 1 ? { status: statuses[0] as any } : { status: { in: statuses as any[] } };
  }

  if (req.user!.role === 'driver') {
    const driver = await prisma.driver.findFirst({ where: { userId: req.user!.uid }, select: { id: true } });
    if (driver) {
      const shippingOrders = await prisma.shippingOrder.findMany({ where: { assignedDriverId: driver.id }, select: { orderId: true } });
      const orderIds = shippingOrders.map(s => s.orderId);
      where = { ...where, id: { in: orderIds } };
    } else {
      sendSuccess(res, []);
      return;
    }
  }

  const orders = await prisma.order.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { items: true, customer: { select: { id: true, googleMapsLink: true } } },
  });
  sendSuccess(res, orders);
});

/** GET /api/orders/:id */
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, logs: { orderBy: { createdAt: 'desc' } } },
  });
  if (!order) { sendError(res, 'Order not found', 404); return; }
  sendSuccess(res, order);
});

/** POST /api/orders */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, ...rawData } = req.body;
  const orderData: Record<string, any> = {};
  const validFields = ['customerId', 'code', 'customerName', 'customerPhone', 'customerEmail', 'customerAddress', 'status', 'priority', 'paymentMethod', 'bankAccountId', 'paymentStatus', 'note', 'quantity', 'deliveryDeadline', 'totalRevenue', 'totalCost', 'profit'];
  for (const key of validFields) {
    if (rawData[key] !== undefined && rawData[key] !== '') orderData[key] = rawData[key];
  }

  const validItemFields = ['productName', 'specification', 'quantity', 'unit', 'unitPrice', 'subSku', 'sku', 'note'];
  const cleanItems = items?.map((item: Record<string, any>) => {
    const clean: Record<string, any> = {};
    for (const key of validItemFields) {
      if (item[key] !== undefined) clean[key] = item[key];
    }
    return clean;
  });

  const order = await prisma.order.create({
    data: {
      ...orderData, createdBy: req.user!.uid, createdByName: req.user!.name,
      code: orderData.code || `DH-${Date.now().toString().slice(-8)}`,
      items: cleanItems?.length ? { create: cleanItems } : undefined,
      logs: { create: { action: 'Tạo đơn hàng', createdBy: req.user!.name || req.user!.email } },
    } as any,
    include: { items: true },
  });

  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid, email: req.user!.email, action: 'Tạo đơn hàng mới',
      module: 'Quản lý đơn hàng', referenceId: order.id, description: `Đơn hàng #${order.code} của ${order.customerName}`,
    },
  });

  if (order.customerId) {
    await prisma.customer.update({
      where: { id: order.customerId },
      data: { totalOrders: { increment: 1 }, totalRevenue: { increment: order.totalRevenue || 0 } },
    }).catch(() => {});
  }

  emitSync(req, 'order_updated', { orderId: order.id, type: 'created' });
  sendSuccess(res, order, 201, 'Order created');
});

/** PUT /api/orders/:id */
export const updateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, ...updateData } = req.body;
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { ...updateData, logs: { create: { action: 'Cập nhật thông tin đơn hàng', createdBy: req.user!.name || req.user!.email } } },
    include: { items: true },
  });
  emitSync(req, 'order_updated', { orderId: order.id, type: 'updated' });
  sendSuccess(res, order, 200, 'Order updated');
});

/** DELETE /api/orders/:id */
export const deleteOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.order.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 200, 'Order deleted');
});

/** GET /api/orders/:id/items */
export const getOrderItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const items = await prisma.orderItem.findMany({ where: { orderId: req.params.id } });
  sendSuccess(res, items);
});

/** GET /api/orders/:id/logs */
export const getOrderLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await prisma.orderLog.findMany({ where: { orderId: req.params.id }, orderBy: { createdAt: 'desc' } });
  sendSuccess(res, logs);
});
