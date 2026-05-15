/**
 * Customer Controller
 * ─────────────────────────────────────────────────────────
 * CRUD operations for Customer management.
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/** GET /api/customers?search=&type=&active=&platform=&status=&group=&boss= */
export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, type, active, platform, status, group, boss } = req.query;

  const where: any = {};

  if (search) {
    const s = String(search);
    where.OR = [
      { name: { contains: s } },
      { phone: { contains: s } },
      { email: { contains: s } },
      { code: { contains: s } },
      { company: { contains: s } },
      { recipientName: { contains: s } },
      { groupName: { contains: s } },
    ];
  }

  if (type) where.customerType = String(type);
  if (active !== undefined) {
    where.isActive = active === 'true';
  } else {
    where.isActive = true; // Hide soft-deleted customers by default
  }
  if (platform) where.operatingPlatform = { contains: String(platform) };
  if (status) where.operationalStatus = String(status);
  if (group) where.groupName = { contains: String(group) };
  if (boss) where.boss = { contains: String(boss) };
  const province = req.query.province;
  if (province) where.province = { contains: String(province) };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { orders: true } },
      pricingRules: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  sendSuccess(res, customers);
});

/** GET /api/customers/:id */
export const getCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          code: true,
          status: true,
          totalRevenue: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true } },
      pricingRules: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!customer) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  sendSuccess(res, customer);
});

/** GET /api/customers/search?q= (lightweight search for order forms) */
export const searchCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q || '');
  if (q.length < 2) {
    sendSuccess(res, []);
    return;
  }

  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { code: { contains: q } },
      ],
    },
    take: 10,
    select: {
      id: true,
      code: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      province: true,
      district: true,
      company: true,
      customerType: true,
      preferredPayment: true,
      bankAccountNumber: true,
      bankName: true,
      bankAccountHolder: true,
      telegramChatId: true,
      googleMapsLink: true,
    },
  });

  sendSuccess(res, customers);
});

/** POST /api/customers */
export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;

  // Phone duplicate check removed to allow B2B shared phone numbers

  const { pricingRules, orders, _count, id: _id, createdAt, updatedAt, ...customerData } = data;

  // Auto-generate code if not provided
  let code = customerData.code;
  if (!code) {
    const latestCustomer = await prisma.customer.findFirst({
      where: { code: { startsWith: 'CUS' } },
      orderBy: { code: 'desc' },
    });
    
    let nextNum = 1;
    if (latestCustomer && latestCustomer.code) {
      const match = latestCustomer.code.match(/CUS(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    code = `CUS${String(nextNum).padStart(5, '0')}`;
  }

  const customer = await prisma.customer.create({
    data: {
      ...customerData,
      code,
    },
  });

  // Log activity
  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid,
      email: req.user!.email,
      action: 'Tạo khách hàng',
      module: 'Khách hàng',
      referenceId: customer.id,
      description: `Tạo khách hàng: ${customer.name} (${customer.code})`,
    },
  });

  sendSuccess(res, customer, 201, 'Customer created');
});

/** PUT /api/customers/:id */
export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;

  // Phone duplicate check removed to allow updating existing records with shared phone numbers

  const { pricingRules, orders, _count, id: _id, createdAt, updatedAt, ...updateData } = data;

  // Ngăn chặn việc lỡ tay xóa trắng mã KH
  if (updateData.code === '') {
    delete updateData.code;
  }

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: updateData,
  });

  sendSuccess(res, customer, 200, 'Customer updated');
});

/** DELETE /api/customers/:id */
export const deleteCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Soft delete — just deactivate
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  sendSuccess(res, customer, 200, 'Customer deactivated');
});

/** GET /api/customers/:id/orders */
export const getCustomerOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { customerId: req.params.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      code: true,
      status: true,
      priority: true,
      customerName: true,
      quantity: true,
      totalRevenue: true,
      totalCost: true,
      paymentMethod: true,
      paymentStatus: true,
      createdAt: true,
      deliveryDeadline: true,
    },
  });

  sendSuccess(res, orders);
});

/** GET /api/customers/:id/history */
export const getCustomerHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customerId = req.params.id;

  const [customer, orders] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, code: true, totalOrders: true, totalRevenue: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        code: true,
        status: true,
        quantity: true,
        totalRevenue: true,
        paymentStatus: true,
        createdAt: true,
        deliveryDeadline: true,
      },
    }),
  ]);

  if (!customer) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  // Aggregate stats
  const totalQuantity = orders.reduce((s, o) => s + (o.quantity || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'hoan_thanh').length;
  const lastOrder = orders[0] || null;

  sendSuccess(res, {
    customer,
    stats: {
      totalOrders: orders.length,
      completedOrders,
      totalQuantity,
      totalRevenue: customer.totalRevenue || 0,
      lastOrderDate: lastOrder?.createdAt || null,
      lastOrderStatus: lastOrder?.status || null,
    },
    orders,
  });
});

/** POST /api/customers/check-phone */
export const checkPhone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phone, excludeId } = req.body;
  if (!phone) {
    sendSuccess(res, { exists: false });
    return;
  }

  const where: any = { phone, isActive: true };
  if (excludeId) where.id = { not: excludeId };

  const existing = await prisma.customer.findFirst({ where });
  sendSuccess(res, {
    exists: !!existing,
    customer: existing ? { id: existing.id, name: existing.name, code: existing.code } : null,
  });
});
