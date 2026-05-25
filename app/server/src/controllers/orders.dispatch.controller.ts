/**
 * Unified Order Flow Controller
 * 
 * Handles the complete lifecycle:
 * cho_duyet → da_duyet → dang_chuan_bi → cho_xuat_kho → dang_giao → hoan_thanh
 * 
 * Roll statuses: trong_kho → da_giu_cho_don → da_xuat_kho
 */
import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendDeliveryProofNotification } from '../services/telegram.service.js';
import { OrderStatus, RollStatus, DriverStatus, ShippingStatus } from '../types/enums.js';

/** Emit socket event to all connected clients */
function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** POST /api/orders/:id/pick-roll — Picking: scan QR to pick a roll */
export const pickRollToOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { qrCode } = req.body as { qrCode: string };
  const orderId = req.params.id;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error('Đơn hàng không tồn tại');

    // Only allow picking for approved orders
    if (!['da_duyet', 'dang_chuan_bi'].includes(order.status)) {
      throw new Error(`Đơn hàng ở trạng thái "${order.status}", không thể soạn hàng. Cần trạng thái "da_duyet" hoặc "dang_chuan_bi".`);
    }

    const roll = await tx.productRoll.findUnique({ where: { qrCode } });
    if (!roll) throw new Error('Mã QR không tồn tại trong hệ thống');

    // Roll must be reserved for THIS order
    if (roll.status !== 'da_giu_cho_don') {
      throw new Error(`Cuộn "${roll.code}" ở trạng thái "${roll.status}", cần trạng thái "da_giu_cho_don" (đã giữ cho đơn hàng)`);
    }
    if (roll.orderId !== order.id) {
      throw new Error('Cuộn này được gán cho một đơn hàng khác');
    }

    // Update roll → da_xuat_kho (picked & ready for export)
    await tx.productRoll.update({
      where: { id: roll.id },
      data: {
        status: RollStatus.da_xuat_kho,
        scanHistory: {
          create: { action: `Soạn hàng cho đơn: ${order.code}`, operator: req.user!.name || 'System' },
        },
      },
    });

    // Update order status to dang_chuan_bi (picking in progress)
    if (order.status === 'da_duyet') {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.dang_chuan_bi,
          logs: { 
            create: { 
              actionType: 'STATUS_CHANGE', 
              action: 'Bắt đầu soạn hàng', 
              createdBy: req.user!.name || req.user!.uid,
              fromStatus: order.status,
              toStatus: 'dang_chuan_bi'
            } 
          },
        },
      });
    }

    // Check if ALL reserved rolls for this order are now picked
    const allOrderRolls = await tx.productRoll.findMany({ where: { orderId: order.id } });
    const allPicked = allOrderRolls.length > 0 && allOrderRolls.every(r => r.status === 'da_xuat_kho');

    if (allPicked) {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.cho_xuat_kho,
          logs: { 
            create: { 
              actionType: 'STATUS_CHANGE', 
              action: 'Soạn hàng xong — Sẵn sàng xuất kho', 
              createdBy: req.user!.name || req.user!.uid,
              fromStatus: order.status,
              toStatus: 'cho_xuat_kho'
            } 
          },
        },
      });
    }

    return { allPicked, rollCode: roll.code, orderCode: order.code };
  });

  emitSync(req, 'order_updated', { orderId, type: 'pick_roll' });
  emitSync(req, 'inventory_updated', { orderId });

  sendSuccess(res, result, 200, result.allPicked
    ? `Soạn hàng xong! Đơn ${result.orderCode} sẵn sàng xuất kho.`
    : `Đã soạn cuộn ${result.rollCode} thành công.`
  );
});

/** POST /api/orders/:id/assign-driver — Dispatch: assign driver & create shipping */
export const assignDriverToOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const { driverId, driverName, vehicle: vehicleInput, deadline, notes } = req.body;

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

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { rolls: true } });
    if (!order) throw new Error('Đơn hàng không tồn tại');

    if (!['da_duyet', 'dang_chuan_bi', 'cho_xuat_kho'].includes(order.status)) {
      throw new Error(`Đơn hàng ở trạng thái "${order.status}", cần trạng thái "đã duyệt" trở lên để gán tài xế`);
    }

    // Get rolls for this order (prefer exported, fall back to all assigned rolls)
    const exportedRolls = order.rolls.filter(r => r.status === 'da_xuat_kho');
    const shippingRolls = exportedRolls.length > 0 ? exportedRolls : order.rolls;

    // Create shipping order linked to this order
    const shippingData: any = {
      code: `SHIP-${Date.now().toString().slice(-6)}`,
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      totalRolls: order.quantity,
      totalQuantity: shippingRolls.length || order.quantity,
      status: ShippingStatus.dang_giao,
      assignedDriverId: driverId,
      assignedDriverName: driverName,
      assignedVehicle: vehicle,
      deliveryDeadline: deadline ? new Date(deadline) : undefined,
      notes,
      createdBy: req.user!.uid,
    };

    // Only create items if there are rolls
    if (shippingRolls.length > 0) {
      shippingData.items = {
        create: shippingRolls.map(roll => ({
          rollId: roll.id,
          qrCode: roll.qrCode,
          productName: roll.productName,
          specification: roll.specification,
          status: 'exported',
        })),
      };
    }

    const shippingOrder = await tx.shippingOrder.create({ data: shippingData });

    // Update order status → dang_giao
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.dang_giao,
        logs: { 
          create: { 
            actionType: 'ASSIGN_DRIVER', 
            action: `Gán tài xế ${driverName} — Bắt đầu giao hàng`, 
            createdBy: req.user!.name || req.user!.uid,
            fromStatus: order.status,
            toStatus: 'dang_giao',
            metadata: { driverId, driverName, vehicle }
          } 
        },
      },
    });

    // Update driver status
    if (driverId) {
      await tx.driver.updateMany({
        where: { id: driverId },
        data: { status: DriverStatus.delivering },
      }).catch(() => {});
    }

    return shippingOrder;
  });

  emitSync(req, 'order_updated', { orderId, type: 'assign_driver' });
  emitSync(req, 'shipping_updated', { shippingOrderId: result.id });

  sendSuccess(res, result, 200, 'Đã gán tài xế và tạo phiếu giao hàng');
});

/** POST /api/orders/:id/complete-delivery — Mark order as delivered */
export const completeDelivery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;

  // Check delivery proofs: require ≥3 photos AND ≥1 video before completing
  const proofs = await prisma.deliveryProof.findMany({
    where: { orderId },
    select: { fileType: true },
  });
  const photoCount = proofs.filter(p => p.fileType === 'image').length;
  const videoCount = proofs.filter(p => p.fileType === 'video').length;

  if (photoCount < 3 || videoCount < 1) {
    const missing: string[] = [];
    if (photoCount < 3) missing.push(`${3 - photoCount} ảnh nữa (đã có ${photoCount}/3)`);
    if (videoCount < 1) missing.push(`1 video (đã có ${videoCount}/1)`);
    sendError(res, `Chưa đủ chứng từ giao hàng. Cần thêm: ${missing.join(', ')}`, 400);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Đơn hàng không tồn tại');
    if (order.status !== 'dang_giao') throw new Error('Đơn hàng không ở trạng thái đang giao');

    // Update order → hoan_thanh
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.hoan_thanh,
        logs: { 
          create: { 
            actionType: 'DELIVERY', 
            action: 'Giao hàng thành công', 
            createdBy: req.user!.name || req.user!.uid,
            fromStatus: order.status,
            toStatus: 'hoan_thanh'
          } 
        },
      },
    });

    // Update shipping orders & get assigned driver
    const shippingOrders = await tx.shippingOrder.findMany({
      where: { orderId: order.id, status: ShippingStatus.dang_giao },
      select: { assignedDriverId: true },
    });
    await tx.shippingOrder.updateMany({
      where: { orderId: order.id, status: ShippingStatus.dang_giao },
      data: { status: ShippingStatus.giao_thanh_cong, deliveredAt: new Date() },
    });

    // ✅ Fix BUG 5: Reset driver status → available after delivery completion
    const driverIds = [...new Set(shippingOrders.map(s => s.assignedDriverId).filter(Boolean))] as string[];
    for (const dId of driverIds) {
      // Only reset if driver has no other active deliveries
      const otherActive = await tx.shippingOrder.count({
        where: { assignedDriverId: dId, status: ShippingStatus.dang_giao },
      });
      if (otherActive === 0) {
        await tx.driver.update({ where: { id: dId }, data: { status: DriverStatus.available } }).catch(() => {});
      }
    }

    // Update customer stats
    if (order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: { totalRevenue: { increment: order.totalRevenue || 0 } },
      }).catch(() => {});
    }
  });

  emitSync(req, 'order_updated', { orderId, type: 'complete' });
  emitSync(req, 'shipping_updated', { orderId });
  emitSync(req, 'driver_vehicle_updated', { action: 'delivery_completed', orderId });

  // Send delivery proof to customer Telegram (async, non-blocking)
  (async () => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true },
      });
      const chatId = order?.customer?.telegramChatId;
      if (chatId) {
        const proofs = await prisma.deliveryProof.findMany({ where: { orderId } });
        if (proofs.length > 0) {
          await sendDeliveryProofNotification(
            chatId,
            order.code,
            order.customerName,
            proofs.map(p => ({ fileType: p.fileType, fileUrl: p.fileUrl }))
          );
        }
      }
    } catch (err) { console.error('[Telegram] Delivery proof notification failed:', err); }
  })();

  sendSuccess(res, null, 200, 'Giao hàng thành công');
});

/** POST /api/orders/:id/fail-delivery — Mark delivery as failed */
export const failDelivery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const { reason } = req.body;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Đơn hàng không tồn tại');

    // Get assigned drivers before updating
    const shippingOrders = await tx.shippingOrder.findMany({
      where: { orderId: order.id, status: ShippingStatus.dang_giao },
      select: { assignedDriverId: true },
    });

    await tx.shippingOrder.updateMany({
      where: { orderId: order.id, status: ShippingStatus.dang_giao },
      data: { status: ShippingStatus.giao_that_bai, failedAt: new Date(), failReason: reason },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.huy,
        note: `Giao thất bại: ${reason}`,
        logs: { 
          create: { 
            actionType: 'DELIVERY', 
            action: `Giao hàng thất bại: ${reason}`, 
            createdBy: req.user!.name || req.user!.uid,
            fromStatus: order.status,
            toStatus: 'huy',
            note: reason
          } 
        },
      },
    });

    // Return rolls to stock
    await tx.productRoll.updateMany({
      where: { orderId: order.id },
      data: { status: RollStatus.trong_kho, orderId: null },
    });

    // ✅ Fix BUG 5: Reset driver status → available after delivery failure
    const driverIds = [...new Set(shippingOrders.map(s => s.assignedDriverId).filter(Boolean))] as string[];
    for (const dId of driverIds) {
      const otherActive = await tx.shippingOrder.count({
        where: { assignedDriverId: dId, status: ShippingStatus.dang_giao },
      });
      if (otherActive === 0) {
        await tx.driver.update({ where: { id: dId }, data: { status: DriverStatus.available } }).catch(() => {});
      }
    }
  });

  emitSync(req, 'order_updated', { orderId, type: 'fail' });
  emitSync(req, 'inventory_updated', { orderId });
  emitSync(req, 'driver_vehicle_updated', { action: 'delivery_failed', orderId });

  sendSuccess(res, null, 200, 'Đã ghi nhận giao hàng thất bại');
});
