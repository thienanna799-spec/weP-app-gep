import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ShippingStatus, RollStatus, OrderStatus } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { recordEvent, formatLocation } from '../services/rollTracking.service.js';
import { recordOrderEvent, statusLabel } from '../services/orderTracking.service.js';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** POST /api/shipping/:id/scan */
export const scanRollToShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { qrCode } = req.body as { qrCode: string };
  const shippingId = req.params.id;

  let rollIdForEvent: string = '';
  let shippingCode: string = '';
  let customerNameSnapshot: string = '';
  let driverNameSnapshot: string = '';
  let fromLoc: string = '';

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

    // Capture snapshots for event
    rollIdForEvent = roll.id;
    shippingCode = shipping.code;
    customerNameSnapshot = shipping.customerName;
    driverNameSnapshot = shipping.assignedDriverName || '';
    fromLoc = formatLocation(roll);

    // Update roll status
    await tx.productRoll.update({
      where: { id: roll.id },
      data: {
        status: ShippingStatus.da_xuat_kho,
        orderId: shipping.orderId,
      },
    });

    const newQty = shipping.totalQuantity + 1;
    const isComplete = newQty >= shipping.totalRolls;

    await tx.shippingOrder.update({
      where: { id: shippingId },
      data: {
        totalQuantity: newQty,
        status: isComplete ? ShippingStatus.da_xuat_kho : ShippingStatus.dang_chuan_bi,
      },
    });

    if (isComplete && shipping.orderId) {
      await tx.order.update({
        where: { id: shipping.orderId },
        data: { status: ShippingStatus.cho_xuat_kho }
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

  // Record enriched lifecycle event AFTER transaction succeeds
  if (rollIdForEvent) {
    // Roll lifecycle event
    await recordEvent(rollIdForEvent, {
      actionType: 'EXPORT',
      action: `Xuất kho theo phiếu: ${shippingCode}`,
      operator: req.user!.name,
      orderCode: shippingCode,
      customerName: customerNameSnapshot,
      driverName: driverNameSnapshot,
      fromLocation: fromLoc,
      metadata: { shippingOrderId: shippingId },
    });

    // ── Audit: SCAN_ROLL on the ShippingOrder ────────
    await recordOrderEvent(shippingId, {
      actionType: 'SCAN_ROLL',
      action: `Scan cuộn ${qrCode} vào phiếu ${shippingCode}`,
      operator: req.user!.name,
      metadata: { qrCode, rollId: rollIdForEvent },
    });
  }

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

  // Capture previous status for audit
  const prevOrder = await prisma.shippingOrder.findUnique({ where: { id: req.params.id }, select: { status: true } });
  const fromStatus = prevOrder?.status || 'unknown';

  const order = await prisma.shippingOrder.update({
    where: { id: req.params.id },
    data: {
      assignedDriverId: driverId,
      assignedDriverName: driverName,
      assignedVehicle: vehicle,
      deliveryDeadline: deadline ? new Date(deadline) : undefined,
      status: ShippingStatus.da_ban_giao_tai_xe,
    },
  });

  // Set driver status to delivering
  await prisma.driver.update({
    where: { id: driverId },
    data: { status: 'delivering' },
  }).catch(() => {});

  // ── Audit: ASSIGN_DRIVER ──────────────────────
  await recordOrderEvent(order.id, {
    actionType: 'ASSIGN_DRIVER',
    action: `Gán tài xế ${driverName} (xe: ${vehicle || 'N/A'})`,
    operator: req.user!.name,
    driverId,
    driverName,
    vehiclePlate: vehicle || undefined,
    fromStatus: String(fromStatus),
    toStatus: 'da_ban_giao_tai_xe',
    metadata: {
      deliveryDeadline: deadline || null,
    },
  });

  // Notify driver tab to refresh
  emitSync(req, 'driver_vehicle_updated', { action: 'driver_assigned', driverId });

  sendSuccess(res, order, 200, 'Driver assigned');
});

/** POST /api/shipping/:id/delivery-log */
export const logDeliveryAction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const shippingId = req.params.id;
  const { action, note, latitude, longitude, imageUrl, signatureUrl } = req.body;

  // Capture current status before changes
  const prevShipping = await prisma.shippingOrder.findUnique({
    where: { id: shippingId },
    select: { status: true, assignedDriverId: true, assignedDriverName: true, assignedVehicle: true, code: true },
  });
  const fromStatus = prevShipping ? String(prevShipping.status) : 'unknown';

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
        status: newStatus as ShippingStatus,
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
          data: { status: orderStatusMap[newStatus] as OrderStatus }
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

  // ── Audit: DELIVERY ──────────────────────
  await recordOrderEvent(shippingId, {
    actionType: newStatus ? 'STATUS_CHANGE' : 'DELIVERY',
    action: `${action}${newStatus ? ` → ${statusLabel(newStatus)}` : ''}`,
    operator: req.user!.name,
    driverId: prevShipping?.assignedDriverId || req.user!.uid,
    driverName: prevShipping?.assignedDriverName || req.user!.name,
    vehiclePlate: prevShipping?.assignedVehicle || undefined,
    fromStatus,
    toStatus: newStatus || fromStatus,
    note: note || undefined,
    metadata: {
      deliveryAction: action,
      latitude: latitude || null,
      longitude: longitude || null,
      imageUrl: imageUrl || null,
      signatureUrl: signatureUrl || null,
    },
  });

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

  const fromStatus = String(shipping.status);

  await prisma.$transaction(async (tx) => {
    const rollIds = shipping.items.map(item => item.rollId);
    
    // Update rolls back to trong_kho
    if (rollIds.length > 0) {
      await tx.productRoll.updateMany({
        where: { id: { in: rollIds } },
        data: { status: RollStatus.trong_kho, orderId: null }
      });

      // Create enriched scan history for each roll
      await tx.rollScanHistory.createMany({
        data: rollIds.map(id => ({
          rollId: id,
          action: `Hoàn kho do giao hàng thất bại — phiếu ${shipping.code}`,
          operator: req.user!.name,
          actionType: 'RETURN',
          orderCode: shipping.code,
          customerName: shipping.customerName,
          driverName: shipping.assignedDriverName || null,
        }))
      });
    }

    // Update shipping status
    await tx.shippingOrder.update({
      where: { id: shippingId },
      data: { status: RollStatus.hoan_tra }
    });

    if (shipping.orderId) {
      await tx.order.update({
        where: { id: shipping.orderId },
        data: { status: OrderStatus.huy }
      });
    }
  });

  // ── Audit: RETURN ──────────────────────
  await recordOrderEvent(shippingId, {
    actionType: 'RETURN',
    action: `Hoàn kho phiếu ${shipping.code} — giao thất bại`,
    operator: req.user!.name,
    driverId: shipping.assignedDriverId || undefined,
    driverName: shipping.assignedDriverName || undefined,
    vehiclePlate: shipping.assignedVehicle || undefined,
    fromStatus,
    toStatus: 'hoan_tra',
    note: req.body.note || `Hoàn trả ${shipping.items.length} cuộn`,
    metadata: {
      rollCount: shipping.items.length,
      rollIds: shipping.items.map(i => i.rollId),
    },
  });

  emitSync(req, 'shipping_updated', { shippingId: shippingId });
  emitSync(req, 'inventory_updated', {});
  emitSync(req, 'order_updated', { type: 'return' });
  sendSuccess(res, null, 200, "Hoàn kho thành công");
});
