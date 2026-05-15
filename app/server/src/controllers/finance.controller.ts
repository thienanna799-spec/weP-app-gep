/**
 * Finance Controller
 * ──────────────────
 * Handles receivables, payments, payables (PO), credit checks, and debt alerts.
 * All data is real-time from DB — no hardcoded values.
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendTelegramMessage } from '../services/telegram.service.js';

// ── GET /finance/summary ────────────────────────────────
export const getFinanceSummary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [orders, materialTxnItems, fuelLogs, payments, poSummary] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ['hoan_thanh', 'dang_giao'] } },
      select: { id: true, totalRevenue: true, paymentStatus: true, customerId: true },
    }),
    prisma.materialTransactionItem.findMany({
      where: { transaction: { type: 'import' } },
      select: { quantity: true, unitPrice: true },
    }),
    prisma.fuelLog.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ['ordered', 'partially_received'] } },
    }),
  ]);

  const totalRevenue = orders.reduce((s, o) => s + (o.totalRevenue || 0), 0);
  const paidRevenue = (payments._sum.amount || 0);
  const unpaidRevenue = totalRevenue - paidRevenue;
  const materialExpense = materialTxnItems.reduce((s, i) => s + (i.quantity * (i.unitPrice || 0)), 0);
  const fuelExpense = fuelLogs._sum.amount || 0;
  const totalExpense = materialExpense + fuelExpense;
  const poPayable = poSummary._sum.totalAmount || 0;

  sendSuccess(res, {
    totalRevenue, paidRevenue, unpaidRevenue,
    materialExpense, fuelExpense, totalExpense,
    profit: paidRevenue - totalExpense,
    balance: totalRevenue - totalExpense,
    poPayable,
    totalOrders: orders.length,
  });
});

// ── GET /finance/receivables ────────────────────────────
export const getReceivables = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['hoan_thanh', 'dang_giao'] },
      paymentStatus: { not: 'da_thanh_toan' },
      totalRevenue: { gt: 0 },
    },
    include: {
      customer: { select: { id: true, name: true, creditLimit: true, creditDays: true, telegramChatId: true } },
      payments: { select: { amount: true, paidAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const result = orders.map(o => {
    const totalPaid = o.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = (o.totalRevenue || 0) - totalPaid;
    const daysSinceCreated = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 86400000);
    return {
      orderId: o.id,
      orderCode: o.code,
      customerId: o.customerId,
      customerName: o.customerName,
      customer: o.customer,
      totalRevenue: o.totalRevenue || 0,
      totalPaid,
      remaining: Math.max(0, remaining),
      daysSinceCreated,
      isOverdue: o.customer ? daysSinceCreated > o.customer.creditDays : daysSinceCreated > 30,
      createdAt: o.createdAt,
    };
  }).filter(o => o.remaining > 0);

  sendSuccess(res, result);
});

// ── GET /finance/receivables/:customerId ────────────────
export const getCustomerReceivable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customerId } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, code: true, phone: true, creditLimit: true, creditDays: true, telegramChatId: true },
  });
  if (!customer) return sendError(res, 'Không tìm thấy KH', 404);

  const orders = await prisma.order.findMany({
    where: {
      customerId,
      status: { in: ['hoan_thanh', 'dang_giao'] },
      paymentStatus: { not: 'da_thanh_toan' },
      totalRevenue: { gt: 0 },
    },
    include: { payments: true },
    orderBy: { createdAt: 'asc' },
  });

  const totalDebt = orders.reduce((s, o) => {
    const paid = o.payments.reduce((sp, p) => sp + p.amount, 0);
    return s + Math.max(0, (o.totalRevenue || 0) - paid);
  }, 0);

  const availableCredit = customer.creditLimit > 0
    ? Math.max(0, customer.creditLimit - totalDebt)
    : Infinity; // 0 = unlimited

  sendSuccess(res, {
    customer,
    totalDebt,
    availableCredit: availableCredit === Infinity ? null : availableCredit,
    isOverLimit: customer.creditLimit > 0 && totalDebt > customer.creditLimit,
    orders: orders.map(o => ({
      id: o.id,
      code: o.code,
      totalRevenue: o.totalRevenue || 0,
      totalPaid: o.payments.reduce((s, p) => s + p.amount, 0),
      remaining: Math.max(0, (o.totalRevenue || 0) - o.payments.reduce((s, p) => s + p.amount, 0)),
      createdAt: o.createdAt,
      payments: o.payments,
    })),
  });
});

// ── POST /finance/payments ──────────────────────────────
export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId, amount, method, reference, note } = req.body;
  if (!orderId || !amount || amount <= 0) {
    return sendError(res, 'orderId và amount > 0 là bắt buộc', 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });
  if (!order) return sendError(res, 'Không tìm thấy đơn hàng', 404);

  const totalPaid = order.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = (order.totalRevenue || 0) - totalPaid;

  if (amount > remaining + 1) { // +1 for rounding
    return sendError(res, `Số tiền vượt quá công nợ còn lại (${remaining.toLocaleString('vi-VN')}đ)`, 400);
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount,
      method: method || 'cash',
      reference,
      note,
      recordedBy: req.user?.uid,
      recordedByName: req.user?.name || req.user?.email,
    },
  });

  // Update order paymentStatus
  const newTotalPaid = totalPaid + amount;
  const newStatus = newTotalPaid >= (order.totalRevenue || 0) ? 'da_thanh_toan' : 'thanh_toan_mot_phan';
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: newStatus },
  });

  sendSuccess(res, { payment, newPaymentStatus: newStatus, totalPaid: newTotalPaid });
});

// ── GET /finance/payments/:orderId ──────────────────────
export const getOrderPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const payments = await prisma.payment.findMany({
    where: { orderId },
    orderBy: { paidAt: 'desc' },
  });
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { totalRevenue: true, paymentStatus: true, code: true },
  });
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  sendSuccess(res, {
    payments,
    totalRevenue: order?.totalRevenue || 0,
    totalPaid,
    remaining: Math.max(0, (order?.totalRevenue || 0) - totalPaid),
    orderCode: order?.code,
  });
});

// ── GET /finance/payables ───────────────────────────────
export const getPayables = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const pos = await prisma.purchaseOrder.findMany({
    where: { status: { in: ['ordered', 'partially_received', 'received'] } },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = pos.map(po => ({
    id: po.id,
    code: po.code,
    supplier: po.supplier,
    totalAmount: po.totalAmount,
    status: po.status,
    createdAt: po.createdAt,
    itemCount: po.items.length,
  }));

  const totalPayable = pos
    .filter(po => ['ordered', 'partially_received'].includes(po.status))
    .reduce((s, po) => s + po.totalAmount, 0);

  sendSuccess(res, { orders: result, totalPayable });
});

// ── GET /finance/credit-check/:customerId ───────────────
export const checkCredit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { customerId } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, creditLimit: true, creditDays: true },
  });
  if (!customer) return sendError(res, 'KH không tồn tại', 404);

  const orders = await prisma.order.findMany({
    where: {
      customerId,
      status: { in: ['hoan_thanh', 'dang_giao'] },
      paymentStatus: { not: 'da_thanh_toan' },
      totalRevenue: { gt: 0 },
    },
    include: { payments: { select: { amount: true } } },
  });

  const totalDebt = orders.reduce((s, o) => {
    const paid = o.payments.reduce((sp, p) => sp + p.amount, 0);
    return s + Math.max(0, (o.totalRevenue || 0) - paid);
  }, 0);

  const available = customer.creditLimit > 0
    ? Math.max(0, customer.creditLimit - totalDebt)
    : null; // null = unlimited

  sendSuccess(res, {
    customerId: customer.id,
    customerName: customer.name,
    creditLimit: customer.creditLimit,
    creditDays: customer.creditDays,
    currentDebt: totalDebt,
    availableCredit: available,
    isOverLimit: customer.creditLimit > 0 && totalDebt > customer.creditLimit,
  });
});

// ── POST /finance/debt-alerts ───────────────────────────
export const sendDebtAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['hoan_thanh', 'dang_giao'] },
      paymentStatus: { not: 'da_thanh_toan' },
      totalRevenue: { gt: 0 },
    },
    include: {
      customer: { select: { id: true, name: true, creditDays: true, telegramChatId: true, phone: true } },
      payments: { select: { amount: true } },
    },
  });

  // Group by customer
  const customerDebts: Record<string, {
    name: string; totalDebt: number; overdueOrders: number;
    creditDays: number; telegramChatId?: string | null; phone?: string;
  }> = {};

  for (const o of orders) {
    if (!o.customer) continue;
    const paid = o.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, (o.totalRevenue || 0) - paid);
    if (remaining <= 0) continue;

    const days = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 86400000);
    if (days <= (o.customer.creditDays || 30)) continue;

    const key = o.customer.id;
    if (!customerDebts[key]) {
      customerDebts[key] = {
        name: o.customer.name,
        totalDebt: 0,
        overdueOrders: 0,
        creditDays: o.customer.creditDays || 30,
        telegramChatId: o.customer.telegramChatId,
        phone: o.customer.phone,
      };
    }
    customerDebts[key].totalDebt += remaining;
    customerDebts[key].overdueOrders++;
  }

  const overdueList = Object.entries(customerDebts);
  let alertsSent = 0;
  let alertsFailed = 0;

  // Send Telegram messages
  for (const [customerId, c] of overdueList) {
    if (!c.telegramChatId) continue;

    const msg = `📋 <b>Nhắc nhở thanh toán</b>\n\n`
      + `Kính gửi: <b>${c.name}</b>\n`
      + `Số đơn quá hạn: <b>${c.overdueOrders}</b>\n`
      + `Tổng công nợ: <b>${c.totalDebt.toLocaleString('vi-VN')}đ</b>\n`
      + `Hạn thanh toán: ${c.creditDays} ngày\n\n`
      + `Vui lòng thanh toán sớm nhất.\n`
      + `<i>GEP Eco-Friendly Packaging 🌿</i>`;

    const sent = await sendTelegramMessage(c.telegramChatId, msg);

    // Log notification
    try {
      await prisma.notificationLog.create({
        data: {
          type: 'debt_alert',
          channel: 'telegram',
          recipient: c.telegramChatId,
          subject: `Nhắc nợ ${c.name}`,
          content: msg,
          status: sent ? 'sent' : 'failed',
          relatedId: customerId,
          relatedType: 'customer',
        },
      });
    } catch (e) { /* ignore log errors */ }

    if (sent) alertsSent++;
    else alertsFailed++;
  }

  sendSuccess(res, {
    alertsSent,
    alertsFailed,
    totalOverdue: overdueList.length,
    overdueCustomers: overdueList.map(([, c]) => c),
    message: `Đã gửi nhắc nợ cho ${alertsSent}/${overdueList.length} khách hàng quá hạn`,
  });
});
