import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getCached, setCache } from '../lib/report-cache.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseFilters(query: Request['query']) {
  const from = query.from ? new Date(query.from as string) : new Date(new Date().setDate(new Date().getDate() - 30));
  const to = query.to ? new Date(query.to as string) : new Date();
  to.setHours(23, 59, 59, 999);
  return {
    from, to,
    machine: (query.machine as string) || undefined,
    productType: (query.productType as string) || undefined,
    customerId: (query.customerId as string) || undefined,
    driverId: (query.driverId as string) || undefined,
  };
}

function getPreviousPeriod(from: Date, to: Date) {
  const diff = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diff);
  return { prevFrom, prevTo };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

const WAREHOUSE_CAPACITY = 500; // configurable threshold

// ─── 1. Summary ───────────────────────────────────────────────────────────

export const getReportSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = parseFilters(req.query);
  const cached = getCached('summary', filters);
  if (cached) return sendSuccess(res, cached);

  const { from, to } = filters;
  const { prevFrom, prevTo } = getPreviousPeriod(from, to);

  const [prodCurrent, invLevel, activeDeliveries, ordersNearDeadline, totalOrders] = await prisma.$transaction([
    prisma.productRoll.count({ where: { createdAt: { gte: from, lte: to }, status: { not: 'loi_hong' } } }),
    prisma.productRoll.count({ where: { status: 'trong_kho' } }),
    prisma.shippingOrder.count({ where: { status: { in: ['dang_giao', 'da_ban_giao_tai_xe'] } } }),
    prisma.order.count({ where: { deliveryDeadline: { gte: new Date(), lte: new Date(Date.now() + 2 * 86400000) }, status: { notIn: ['hoan_thanh', 'huy'] } } }),
    prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
  ]);

  const prodPrevious = await prisma.productRoll.count({ where: { createdAt: { gte: prevFrom, lte: prevTo }, status: { not: 'loi_hong' } } });
  const prevOrders = await prisma.order.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } });

  // Low stock: fetch all then filter (Prisma can't compare two columns)
  const allMats = await prisma.material.findMany({ select: { currentStock: true, minStock: true } });
  const lowStockCount = allMats.filter(m => m.currentStock <= m.minStock).length;

  const failedDel = await prisma.shippingOrder.count({ where: { status: 'giao_that_bai', createdAt: { gte: from, lte: to } } });
  const totalDel = await prisma.shippingOrder.count({ where: { createdAt: { gte: from, lte: to } } });
  const slowRolls = await prisma.productRoll.count({ where: { status: 'trong_kho', createdAt: { lte: new Date(Date.now() - 30 * 86400000) } } });

  const alerts: { type: string; message: string; severity: 'warning' | 'danger' | 'info' }[] = [];
  if (lowStockCount > 0) alerts.push({ type: 'material', message: `${lowStockCount} nguyên liệu dưới mức tồn kho tối thiểu`, severity: 'warning' });
  if (ordersNearDeadline > 0) alerts.push({ type: 'deadline', message: `${ordersNearDeadline} đơn hàng sắp đến hạn giao (< 2 ngày)`, severity: 'warning' });
  if (totalDel > 0 && (failedDel / totalDel) > 0.1) alerts.push({ type: 'delivery', message: `Tỷ lệ giao thất bại cao: ${Math.round((failedDel / totalDel) * 100)}%`, severity: 'danger' });
  if (slowRolls > 10) alerts.push({ type: 'slowstock', message: `${slowRolls} cuộn tồn kho > 30 ngày`, severity: 'warning' });
  if (invLevel > WAREHOUSE_CAPACITY) alerts.push({ type: 'capacity', message: `Kho đang ${Math.round((invLevel / WAREHOUSE_CAPACITY) * 100)}% sức chứa (${invLevel}/${WAREHOUSE_CAPACITY})`, severity: 'danger' });

  const result = {
    production: { current: prodCurrent, previous: prodPrevious, change: pctChange(prodCurrent, prodPrevious) },
    orders: { current: totalOrders, previous: prevOrders, change: pctChange(totalOrders, prevOrders) },
    inventory: invLevel,
    activeDeliveries,
    alerts,
    alertCount: alerts.length,
  };
  setCache('summary', filters, result);
  sendSuccess(res, result);
});

// ─── 2. Production ────────────────────────────────────────────────────────

export const getReportProduction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = parseFilters(req.query);
  const cached = getCached('production', filters);
  if (cached) return sendSuccess(res, cached);

  const { from, to, machine, productType } = filters;
  const { prevFrom, prevTo } = getPreviousPeriod(from, to);

  const where: any = { createdAt: { gte: from, lte: to } };
  if (machine) where.productionOrder = { machineArea: machine };
  if (productType) where.productName = { contains: productType };

  const rolls = await prisma.productRoll.findMany({
    where,
    select: { id: true, createdAt: true, status: true, productName: true, productionOrder: { select: { machineArea: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Production orders stats
  const prodOrders = await prisma.productionOrder.findMany({
    where: { createdAt: { gte: from, lte: to }, ...(machine ? { machineArea: machine } : {}) },
    select: { id: true, status: true, targetRolls: true, machineArea: true, completedAt: true, createdAt: true },
  });
  const poCompleted = prodOrders.filter(p => p.status === 'completed').length;
  const poTotal = prodOrders.length;
  const targetTotal = prodOrders.reduce((s, p) => s + p.targetRolls, 0);

  const dailyMap = new Map<string, { ok: number; defect: number; total: number }>();
  rolls.forEach(r => {
    const day = r.createdAt.toISOString().slice(0, 10);
    const e = dailyMap.get(day) || { ok: 0, defect: 0, total: 0 };
    e.total++;
    r.status === 'loi_hong' ? e.defect++ : e.ok++;
    dailyMap.set(day, e);
  });

  const machineMap = new Map<string, number>();
  rolls.forEach(r => { const m = r.productionOrder?.machineArea || 'Không rõ'; machineMap.set(m, (machineMap.get(m) || 0) + 1); });

  const statusMap = new Map<string, number>();
  rolls.forEach(r => { statusMap.set(r.status, (statusMap.get(r.status) || 0) + 1); });

  const prevCount = await prisma.productRoll.count({ where: { createdAt: { gte: prevFrom, lte: prevTo }, status: { not: 'loi_hong' } } });
  const daysInRange = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));

  const result = {
    dailyTrend: Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d })),
    byMachine: Array.from(machineMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
    totalRolls: rolls.length,
    rollsPerDay: Math.round((rolls.length / daysInRange) * 10) / 10,
    productionOrders: { total: poTotal, completed: poCompleted, targetRolls: targetTotal, actualRolls: rolls.length, fulfillment: targetTotal > 0 ? Math.round((rolls.length / targetTotal) * 100) : 0 },
    comparison: { current: rolls.length, previous: prevCount, change: pctChange(rolls.length, prevCount) },
  };
  setCache('production', filters, result);
  sendSuccess(res, result);
});

// ─── 3. Materials ─────────────────────────────────────────────────────────

export const getReportMaterials = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = parseFilters(req.query);
  const cached = getCached('materials', filters);
  if (cached) return sendSuccess(res, cached);

  const { from, to } = filters;

  const transactions = await prisma.materialTransactionItem.findMany({
    where: { transaction: { date: { gte: from, lte: to } } },
    include: { transaction: { select: { type: true, date: true } }, material: { select: { name: true, currentStock: true, minStock: true, purchasePrice: true } } },
  });

  // Planned consumption from BOM
  const boms = await prisma.materialBOMComponent.findMany({ select: { materialId: true, materialName: true, quantity: true, bom: { select: { productName: true } } } });
  const plannedMap = new Map<string, number>();
  boms.forEach(b => plannedMap.set(b.materialId, (plannedMap.get(b.materialId) || 0) + b.quantity));

  const materialMap = new Map<string, { name: string; imported: number; exported: number; stock: number; minStock: number; price: number; planned: number }>();
  transactions.forEach(t => {
    const e = materialMap.get(t.materialId) || { name: t.materialName, imported: 0, exported: 0, stock: t.material?.currentStock || 0, minStock: t.material?.minStock || 0, price: t.material?.purchasePrice || 0, planned: plannedMap.get(t.materialId) || 0 };
    t.transaction.type === 'import' ? (e.imported += t.quantity) : (e.exported += t.quantity);
    materialMap.set(t.materialId, e);
  });

  const materialUsage = Array.from(materialMap.entries()).map(([id, d]) => ({
    id, ...d,
    variance: d.planned > 0 ? Math.round(((d.exported - d.planned) / d.planned) * 100) : 0,
    estimatedCost: Math.round(d.exported * d.price),
  }));

  const allMats = await prisma.material.findMany({ select: { id: true, name: true, currentStock: true, minStock: true } });
  const lowStock = allMats.filter(m => m.currentStock <= m.minStock);
  const totalEstCost = materialUsage.reduce((s, m) => s + m.estimatedCost, 0);

  const result = { materialUsage, lowStock, totalTransactions: transactions.length, totalEstimatedCost: totalEstCost };
  setCache('materials', filters, result);
  sendSuccess(res, result);
});

// ─── 4. Inventory ─────────────────────────────────────────────────────────

export const getReportInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = parseFilters(req.query);
  const cached = getCached('inventory', filters);
  if (cached) return sendSuccess(res, cached);

  const { from, to } = filters;

  const rollsByProduct = await prisma.productRoll.groupBy({ by: ['productName'], where: { status: 'trong_kho' }, _count: { id: true } });
  const stockByProduct = rollsByProduct.map(r => ({ name: r.productName, count: r._count.id })).sort((a, b) => b.count - a.count);

  const inRolls = await prisma.productRoll.findMany({ where: { status: { in: ['trong_kho', 'da_giu_cho_don', 'da_xuat_kho'] }, createdAt: { gte: from, lte: to } }, select: { createdAt: true } });
  const outRolls = await prisma.productRoll.findMany({ where: { status: 'da_xuat_kho', updatedAt: { gte: from, lte: to } }, select: { updatedAt: true } });

  const movMap = new Map<string, { inCount: number; outCount: number }>();
  inRolls.forEach(r => { const d = r.createdAt.toISOString().slice(0, 10); const e = movMap.get(d) || { inCount: 0, outCount: 0 }; e.inCount++; movMap.set(d, e); });
  outRolls.forEach(r => { const d = r.updatedAt.toISOString().slice(0, 10); const e = movMap.get(d) || { inCount: 0, outCount: 0 }; e.outCount++; movMap.set(d, e); });

  const slowMoving = await prisma.productRoll.findMany({
    where: { status: 'trong_kho', createdAt: { lte: new Date(Date.now() - 30 * 86400000) } },
    select: { id: true, productName: true, specification: true, createdAt: true },
    orderBy: { createdAt: 'asc' }, take: 50,
  });

  const totalShipped = await prisma.productRoll.count({ where: { status: 'da_xuat_kho', updatedAt: { gte: from, lte: to } } });
  const currentStock = await prisma.productRoll.count({ where: { status: 'trong_kho' } });
  const turnoverRate = currentStock > 0 ? Math.round((totalShipped / currentStock) * 100) / 100 : 0;
  const rollsByStatus = await prisma.productRoll.groupBy({ by: ['status'], _count: { id: true } });

  const result = {
    stockByProduct,
    stockMovement: Array.from(movMap.entries()).map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date)),
    slowMoving, turnoverRate, currentStock, totalShipped,
    warehouseCapacity: WAREHOUSE_CAPACITY,
    capacityPercent: Math.round((currentStock / WAREHOUSE_CAPACITY) * 100),
    statusDistribution: rollsByStatus.map(r => ({ status: r.status, count: r._count.id })),
  };
  setCache('inventory', filters, result);
  sendSuccess(res, result);
});

// ─── 5. Delivery ──────────────────────────────────────────────────────────

export const getReportDelivery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = parseFilters(req.query);
  const cached = getCached('delivery', filters);
  if (cached) return sendSuccess(res, cached);

  const { from, to, driverId } = filters;
  const { prevFrom, prevTo } = getPreviousPeriod(from, to);

  const where: any = { createdAt: { gte: from, lte: to } };
  if (driverId) where.assignedDriverId = driverId;

  const shipments = await prisma.shippingOrder.findMany({
    where,
    select: { id: true, status: true, assignedDriverName: true, assignedDriverId: true, createdAt: true, shippedAt: true, deliveredAt: true, failedAt: true },
  });

  const total = shipments.length;
  const delivered = shipments.filter(s => s.status === 'giao_thanh_cong').length;
  const failed = shipments.filter(s => s.status === 'giao_that_bai').length;
  const inProgress = shipments.filter(s => ['dang_giao', 'da_ban_giao_tai_xe'].includes(s.status)).length;
  const onTimeRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const deliveredShips = shipments.filter(s => s.deliveredAt && s.shippedAt);
  const avgHours = deliveredShips.length > 0
    ? Math.round(deliveredShips.reduce((s, x) => s + ((x.deliveredAt!.getTime() - x.shippedAt!.getTime()) / 3600000), 0) / deliveredShips.length * 10) / 10
    : 0;

  // Delivery logs for timeline
  const deliveryLogs = await prisma.deliveryLog.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { action: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const driverMap = new Map<string, { name: string; total: number; delivered: number; failed: number }>();
  shipments.forEach(s => {
    const dId = s.assignedDriverId || 'none';
    const e = driverMap.get(dId) || { name: s.assignedDriverName || 'Chưa gán', total: 0, delivered: 0, failed: 0 };
    e.total++;
    if (s.status === 'giao_thanh_cong') e.delivered++;
    if (s.status === 'giao_that_bai') e.failed++;
    driverMap.set(dId, e);
  });

  const statusDist = [
    { status: 'Thành công', count: delivered, color: '#22c55e' },
    { status: 'Đang giao', count: inProgress, color: '#3b82f6' },
    { status: 'Thất bại', count: failed, color: '#ef4444' },
    { status: 'Khác', count: total - delivered - failed - inProgress, color: '#94a3b8' },
  ].filter(d => d.count > 0);

  const prevTotal = await prisma.shippingOrder.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } });

  const result = {
    total, delivered, failed, inProgress, onTimeRate, avgDeliveryHours: avgHours,
    byDriver: Array.from(driverMap.values()).sort((a, b) => b.total - a.total),
    statusDistribution: statusDist,
    deliveryLogCount: deliveryLogs.length,
    comparison: { current: total, previous: prevTotal, change: pctChange(total, prevTotal) },
  };
  setCache('delivery', filters, result);
  sendSuccess(res, result);
});

// ─── 6. Customers ─────────────────────────────────────────────────────────

export const getReportCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = parseFilters(req.query);
  const cached = getCached('customers', filters);
  if (cached) return sendSuccess(res, cached);

  const { from, to, customerId } = filters;

  const where: any = { createdAt: { gte: from, lte: to } };
  if (customerId) where.customerId = customerId;

  const ordersByCustomer = await prisma.order.groupBy({
    by: ['customerName', 'customerId'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 15,
  });

  const allCustOrders = await prisma.order.groupBy({ by: ['customerId'], where: { ...where, customerId: { not: null } }, _count: { id: true } });
  const totalCustomers = allCustOrders.length;
  const repeatCustomers = allCustOrders.filter(c => c._count.id > 1).length;

  const orders = await prisma.order.findMany({ where, select: { createdAt: true }, orderBy: { createdAt: 'asc' } });
  const monthlyMap = new Map<string, number>();
  orders.forEach(o => { const m = o.createdAt.toISOString().slice(0, 7); monthlyMap.set(m, (monthlyMap.get(m) || 0) + 1); });

  const orderStatus = await prisma.order.groupBy({ by: ['status'], where, _count: { id: true } });

  const result = {
    topCustomers: ordersByCustomer.map(o => ({ name: o.customerName, customerId: o.customerId, orderCount: o._count.id })),
    totalCustomers,
    repeatCustomers,
    repeatRate: totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0,
    monthlyTrend: Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count })),
    statusDistribution: orderStatus.map(o => ({ status: o.status, count: o._count.id })),
    totalOrders: orders.length,
  };
  setCache('customers', filters, result);
  sendSuccess(res, result);
});

// ─── 7. Export ─────────────────────────────────────────────────────────────

export const exportReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type } = req.params;
  const filters = parseFilters(req.query);
  const { from, to } = filters;
  let data: any[] = [];
  let fileName = 'report';

  switch (type) {
    case 'production': {
      const rolls = await prisma.productRoll.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { id: true, productName: true, specification: true, status: true, createdAt: true, length: true, weight: true, creator: true },
        orderBy: { createdAt: 'desc' },
      });
      data = rolls.map(r => ({ 'Mã cuộn': r.id, 'Sản phẩm': r.productName, 'Quy cách': r.specification, 'Trạng thái': r.status, 'Dài (m)': r.length, 'Nặng (kg)': r.weight, 'Người SX': r.creator, 'Ngày': r.createdAt.toISOString().slice(0, 10) }));
      fileName = 'bao_cao_san_xuat';
      break;
    }
    case 'inventory': {
      const rolls = await prisma.productRoll.findMany({
        where: { status: 'trong_kho' },
        select: { id: true, productName: true, specification: true, positionWarehouse: true, positionArea: true, createdAt: true, length: true, weight: true },
        orderBy: { createdAt: 'asc' },
      });
      data = rolls.map(r => ({ 'Mã cuộn': r.id, 'Sản phẩm': r.productName, 'Quy cách': r.specification, 'Kho': r.positionWarehouse || '', 'Khu vực': r.positionArea || '', 'Dài (m)': r.length, 'Nặng (kg)': r.weight, 'Ngày nhập': r.createdAt.toISOString().slice(0, 10) }));
      fileName = 'bao_cao_ton_kho';
      break;
    }
    case 'materials': {
      const mats = await prisma.material.findMany({
        select: { code: true, name: true, group: true, unit: true, currentStock: true, minStock: true, purchasePrice: true, supplier: true },
        orderBy: { name: 'asc' },
      });
      data = mats.map(m => ({ 'Mã': m.code, 'Tên': m.name, 'Nhóm': m.group, 'ĐVT': m.unit, 'Tồn': m.currentStock, 'Tối thiểu': m.minStock, 'Giá': m.purchasePrice, 'NCC': m.supplier || '' }));
      fileName = 'bao_cao_nguyen_lieu';
      break;
    }
    case 'delivery': {
      const ships = await prisma.shippingOrder.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { code: true, customerName: true, customerPhone: true, customerAddress: true, status: true, assignedDriverName: true, createdAt: true, deliveredAt: true, totalRolls: true },
        orderBy: { createdAt: 'desc' },
      });
      data = ships.map(s => ({ 'Mã': s.code, 'KH': s.customerName, 'SĐT': s.customerPhone, 'Địa chỉ': s.customerAddress, 'TT': s.status, 'Tài xế': s.assignedDriverName || '', 'Cuộn': s.totalRolls, 'Ngày tạo': s.createdAt.toISOString().slice(0, 10), 'Ngày giao': s.deliveredAt?.toISOString().slice(0, 10) || '' }));
      fileName = 'bao_cao_giao_hang';
      break;
    }
    case 'customers': {
      const custs = await prisma.customer.findMany({
        select: { code: true, name: true, phone: true, address: true, totalOrders: true, customerType: true, createdAt: true },
        orderBy: { totalOrders: 'desc' },
      });
      data = custs.map(c => ({ 'Mã': c.code, 'Tên': c.name, 'SĐT': c.phone, 'Địa chỉ': c.address, 'Loại': c.customerType, 'Đơn': c.totalOrders, 'Ngày': c.createdAt.toISOString().slice(0, 10) }));
      fileName = 'bao_cao_khach_hang';
      break;
    }
    default:
      return sendError(res, `Unknown report type: ${type}`, 400);
  }

  sendSuccess(res, { data, fileName, total: data.length });
});

// ─── Filter Options ───────────────────────────────────────────────────────

export const getReportFilterOptions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [machines, products, customers, drivers] = await prisma.$transaction([
    prisma.productionOrder.findMany({ select: { machineArea: true }, distinct: ['machineArea'], where: { machineArea: { not: null } } }),
    prisma.productRoll.findMany({ select: { productName: true }, distinct: ['productName'] }),
    prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 100 }),
    prisma.driver.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  sendSuccess(res, {
    machines: machines.map(m => m.machineArea).filter(Boolean),
    products: products.map(p => p.productName),
    customers: customers.map(c => ({ id: c.id, name: c.name })),
    drivers: drivers.map(d => ({ id: d.id, name: d.name })),
  });
});
