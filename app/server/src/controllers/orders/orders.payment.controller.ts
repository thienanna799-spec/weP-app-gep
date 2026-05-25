import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';
import { emitSync } from './orders.core.controller.js';
import { recordSalesOrderEvent } from '../../services/orderTracking.service.js';

/** PUT /api/orders/:id/payment-status — Update payment status */
export const updatePaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { paymentStatus } = req.body;
  const orderId = req.params.id;

  if (!['chua_thanh_toan', 'da_thanh_toan'].includes(paymentStatus)) {
    sendError(res, 'Trạng thái thanh toán không hợp lệ', 400);
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) { sendError(res, 'Đơn hàng không tồn tại', 404); return; }

  const isPaying = paymentStatus === 'da_thanh_toan' && order.paymentStatus !== 'da_thanh_toan';
  const isUnpaying = paymentStatus === 'chua_thanh_toan' && order.paymentStatus === 'da_thanh_toan';

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus,
    },
  });

  await recordSalesOrderEvent(orderId, {
    actionType: 'PAYMENT',
    action: isPaying ? 'Xác nhận thanh toán' : 'Hủy thanh toán',
    operator: req.user!.name || req.user!.uid,
    metadata: { oldPaymentStatus: order.paymentStatus, newPaymentStatus: paymentStatus }
  });

  if (order.customerId && order.totalRevenue) {
    if (isPaying) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: { totalRevenue: { increment: order.totalRevenue } },
      }).catch(() => {});
    } else if (isUnpaying) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: { totalRevenue: { decrement: order.totalRevenue } },
      }).catch(() => {});
    }
  }

  emitSync(req, 'order_updated', { orderId, type: 'payment_update', paymentStatus });
  sendSuccess(res, updatedOrder, 200, isPaying ? 'Đã xác nhận thanh toán' : 'Đã hủy thanh toán');
});
