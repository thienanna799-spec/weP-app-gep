import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  renderPickingSlipHTML,
  generatePickingSlipPDF,
  buildPickingSlipData,
} from '../services/picking-slip.service.js';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/shipping?status= */
export const getShippingOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  const orders = await prisma.shippingOrder.findMany({
    where: status && status !== 'All' ? { status: status as any } : undefined,
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
      data: { status: 'dang_chuan_bi' as any }
    });
  }

  sendSuccess(res, newShippingOrder, 201, 'Shipping order created');
});

/** POST /api/shipping/:id/scan */
export const scanRollToShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { qrCode } = req.body as { qrCode: string };
  const shippingId = req.params.id;

  await prisma.$transaction(async (tx) => {
    const shipping = await tx.shippingOrder.findUnique({ where: { id: shippingId } });
    if (!shipping) throw new Error('Phiếu xuất kho không tồn tại');

    const roll = await tx.productRoll.findUnique({ where: { qrCode } });
    if (!roll) throw new Error('Mã QR không tồn tại trong hệ thống');
    if (roll.status === 'da_xuat_kho') throw new Error('Cuộn này đã được xuất kho trước đó');
    if (roll.status === 'loi_hong') throw new Error('Cuộn bị lỗi / hỏng, không thể xuất');
    
    if (roll.orderId !== shipping.orderId) {
      throw new Error('Cuộn này không thuộc đơn hàng của phiếu xuất kho này');
    }

    if (roll.status !== 'da_giu_cho_don') {
      throw new Error('Cuộn này chưa được giữ (reserve) cho đơn hàng, hoặc sai trạng thái');
    }

    const alreadyScanned = await tx.shippingOrderItem.findFirst({
      where: { shippingOrderId: shippingId, qrCode },
    });
    if (alreadyScanned) throw new Error('Cuộn này đã có trong danh sách xuất kho');

    // Update roll
    await tx.productRoll.update({
      where: { id: roll.id },
      data: {
        status: 'da_xuat_kho' as any,
        orderId: shipping.orderId,
        scanHistory: {
          create: {
            action: `Xuất kho theo phiếu: ${shipping.code}`,
            operator: req.user!.name,
          },
        },
      },
    });

    const newQty = shipping.totalQuantity + 1;
    const isComplete = newQty >= shipping.totalRolls;

    await tx.shippingOrder.update({
      where: { id: shippingId },
      data: {
        totalQuantity: newQty,
        status: isComplete ? 'da_xuat_kho' as any : 'dang_chuan_bi' as any,
      },
    });

    if (isComplete && shipping.orderId) {
      await tx.order.update({
        where: { id: shipping.orderId },
        data: { status: 'cho_xuat_kho' as any }
      });
    }

    await tx.shippingOrderItem.create({
      data: {
        shippingOrderId: shippingId,
        rollId: roll.id,
        qrCode,
        productName: roll.productName,
        specification: roll.specification,
      },
    });
  });

  emitSync(req, 'shipping_updated', { shippingId: shippingId });
  emitSync(req, 'inventory_updated', {});
  emitSync(req, 'order_updated', { type: 'shipping_scan' });
  sendSuccess(res, null, 200, 'Roll scanned to shipping');
});

/** PUT /api/shipping/:id/assign-driver */
export const assignDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { driverId, driverName, vehicle: vehicleInput, deadline } = req.body;

  // Auto-resolve vehicle plate from driver's session/profile if not manually specified
  let vehicle = vehicleInput;
  if (!vehicle && driverId) {
    // Priority 1: Today's active DailyVehicleLog
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLog = await prisma.dailyVehicleLog.findFirst({
      where: { driverId, logDate: today, status: 'active' },
      select: { plateNumber: true },
    });
    if (todayLog) {
      vehicle = todayLog.plateNumber;
    } else {
      // Priority 2: Driver's currently assigned vehicle
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: { vehicle: { select: { plateNumber: true } } },
      });
      if (driver?.vehicle) vehicle = driver.vehicle.plateNumber;
    }
  }

  const order = await prisma.shippingOrder.update({
    where: { id: req.params.id },
    data: {
      assignedDriverId: driverId,
      assignedDriverName: driverName,
      assignedVehicle: vehicle,
      deliveryDeadline: deadline ? new Date(deadline) : undefined,
      status: 'da_ban_giao_tai_xe' as any,
    },
  });

  // Set driver status to delivering
  await prisma.driver.update({
    where: { id: driverId },
    data: { status: 'delivering' },
  }).catch(() => {});

  // Notify driver tab to refresh
  emitSync(req, 'driver_vehicle_updated', { action: 'driver_assigned', driverId });

  sendSuccess(res, order, 200, 'Driver assigned');
});

/** POST /api/shipping/:id/delivery-log */
export const logDeliveryAction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shippingId = req.params.id;
  const { action, note, latitude, longitude } = req.body;

  await prisma.deliveryLog.create({
    data: { shippingOrderId: shippingId, driverId: req.user!.uid, action, note, latitude, longitude },
  });

  let newStatus: string | undefined;
  if (action === 'Bắt đầu giao hàng') newStatus = 'dang_giao';
  if (action === 'Giao hàng thành công') newStatus = 'giao_thanh_cong';
  if (action === 'Giao hàng thất bại') newStatus = 'giao_that_bai';

  if (newStatus) {
    const updatedShipping = await prisma.shippingOrder.update({
      where: { id: shippingId },
      data: {
        status: newStatus as any,
        ...(newStatus === 'giao_thanh_cong' ? { deliveredAt: new Date() } : {}),
        ...(newStatus === 'giao_that_bai' ? { failedAt: new Date(), failReason: note } : {}),
      },
    });

    if (updatedShipping.orderId) {
      const orderStatusMap: Record<string, string> = {
        'dang_giao': 'dang_giao',
        'giao_thanh_cong': 'hoan_thanh'
      };
      
      if (orderStatusMap[newStatus]) {
        await prisma.order.update({
          where: { id: updatedShipping.orderId },
          data: { status: orderStatusMap[newStatus] as any }
        });
      }
    }

    // Auto-reset driver status when no more active deliveries
    if (newStatus === 'giao_thanh_cong' || newStatus === 'giao_that_bai') {
      if (updatedShipping.assignedDriverId) {
        const remainingActive = await prisma.shippingOrder.count({
          where: { assignedDriverId: updatedShipping.assignedDriverId, status: 'dang_giao' },
        });
        if (remainingActive === 0) {
          await prisma.driver.update({
            where: { id: updatedShipping.assignedDriverId },
            data: { status: 'available' },
          }).catch(() => {});
        }
      }
    }
  }

  emitSync(req, 'shipping_updated', { shippingId: shippingId });
  emitSync(req, 'order_updated', { type: 'delivery_log' });
  // Also emit driver_vehicle_updated so the Drivers tab refreshes instantly
  emitSync(req, 'driver_vehicle_updated', { action: 'delivery_status_change' });
  sendSuccess(res, null, 200, 'Delivery action logged');
});

/** PUT /api/shipping/:id/return */
export const returnShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shippingId = req.params.id;
  const shipping = await prisma.shippingOrder.findUnique({
    where: { id: shippingId },
    include: { items: true }
  });

  if (!shipping) { sendError(res, "Không tìm thấy phiếu giao hàng", 404); return; }
  if (shipping.status !== 'giao_that_bai') { sendError(res, "Chỉ có thể hoàn kho phiếu giao hàng thất bại", 400); return; }

  await prisma.$transaction(async (tx) => {
    const rollIds = shipping.items.map(item => item.rollId);
    
    // Update rolls back to trong_kho
    if (rollIds.length > 0) {
      await tx.productRoll.updateMany({
        where: { id: { in: rollIds } },
        data: { status: 'trong_kho' as any, orderId: null }
      });

      // Create scan history
      await tx.rollScanHistory.createMany({
        data: rollIds.map(id => ({
          rollId: id,
          action: 'Hoàn kho do giao hàng thất bại',
          operator: req.user!.name
        }))
      });
    }

    // Update shipping status
    await tx.shippingOrder.update({
      where: { id: shippingId },
      data: { status: 'hoan_tra' as any }
    });

    if (shipping.orderId) {
      await tx.order.update({
        where: { id: shipping.orderId },
        data: { status: 'huy' as any }
      });
    }
  });

  emitSync(req, 'shipping_updated', { shippingId: shippingId });
  emitSync(req, 'inventory_updated', {});
  emitSync(req, 'order_updated', { type: 'return' });
  sendSuccess(res, null, 200, "Hoàn kho thành công");
});

// ── Picking Slip ───────────────────────────────────────────

/** Helper to load shipping + order data for picking slip */
async function getShippingWithOrder(shippingId: string) {
  const shipping = await prisma.shippingOrder.findUnique({
    where: { id: shippingId },
    include: { items: true },
  });
  if (!shipping) return null;

  const order = await prisma.order.findUnique({
    where: { id: shipping.orderId },
    include: { items: true },
  });

  return { shipping, order };
}

/** GET /api/shipping/:id/picking-slip/preview — HTML preview */
export const previewPickingSlip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getShippingWithOrder(req.params.id);
  if (!data) { sendError(res, 'Shipping order not found', 404); return; }

  const slipData = buildPickingSlipData(data.shipping, data.order);
  const html = renderPickingSlipHTML(slipData);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

/** GET /api/shipping/:id/picking-slip/pdf — Download PDF */
export const downloadPickingSlipPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getShippingWithOrder(req.params.id);
  if (!data) { sendError(res, 'Shipping order not found', 404); return; }

  const slipData = buildPickingSlipData(data.shipping, data.order);

  try {
    const pdfBuffer = await generatePickingSlipPDF(slipData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Phieu_lay_hang_${data.shipping.code}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    if (err.message?.includes('Puppeteer')) {
      const html = renderPickingSlipHTML(slipData);
      const printHtml = html.replace(
        '</body>',
        `<script>
          window.onload = function() {
            if (confirm('Puppeteer không khả dụng. Mở trang in để tạo PDF?')) {
              window.print();
            }
          };
        </script></body>`
      );
      res.setHeader('Content-Type', 'text/html');
      res.send(printHtml);
      return;
    }
    throw err;
  }
});

/** GET /api/shipping/:id/picking-slip/data — JSON data for frontend rendering */
export const getPickingSlipData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getShippingWithOrder(req.params.id);
  if (!data) { sendError(res, 'Shipping order not found', 404); return; }

  const slipData = buildPickingSlipData(data.shipping, data.order);
  sendSuccess(res, slipData);
});
