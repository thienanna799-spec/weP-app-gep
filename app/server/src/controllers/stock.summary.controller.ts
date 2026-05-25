import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/**
 * GET /api/inventory/stock-summary
 * Aggregates rolls by (supplier, subSku) showing nhập kho, xuất kho, tồn kho
 */
export const getStockSummary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  // Read all declared products with their stored nhapKho/xuatKho/tonKho values
  const declaredProducts = await prisma.importBatch.findMany({
    select: {
      supplier: true,
      subSku: true,
      productName: true,
      sku: true,
      specification: true,
      nhapKho: true,
      xuatKho: true,
      tonKho: true,
      minStock: true,
      createdAt: true,
      color: true,
      size: true,
      salesUnit: true,
      unitSize: true,
      pricePerUnit: true,
      costPrice: true,
      quantity: true,
    }
  });

  // Fetch pricing counts grouped by sku
  const pricingGroups = await prisma.customerPricing.groupBy({
    by: ['sku'],
    where: { isActive: true },
    _count: {
      customerId: true
    }
  });
  const pricingCountMap = new Map<string, number>();
  for (const group of pricingGroups) {
    if (group.sku) {
      pricingCountMap.set(group.sku, group._count.customerId);
    }
  }

  // Fetch physical rolls grouped by product identity fields + status
  const rollGroups = await prisma.productRoll.groupBy({
    by: [
      'supplier',
      'subSku',
      'productName',
      'sku',
      'specification',
      'color',
      'size',
      'salesUnit',
      'unitSize',
      'pricePerUnit',
      'status'
    ],
    _count: {
      id: true
    }
  });

  // Fetch 'loi_hong' rolls that are classified as 'hong' (action contains 'Hàng hỏng')
  const hongGroups = await prisma.productRoll.groupBy({
    by: [
      'supplier',
      'subSku',
      'productName',
      'sku',
      'specification',
      'color',
      'size',
      'salesUnit',
      'unitSize',
      'pricePerUnit'
    ],
    where: {
      status: 'loi_hong',
      scanHistory: {
        some: {
          action: { contains: 'Hàng hỏng' }
        }
      }
    },
    _count: {
      id: true
    }
  });

  const hongMap = new Map<string, number>();
  for (const h of hongGroups) {
    const detailedKey = `${h.supplier || ''}||${h.subSku || ''}||${h.productName || ''}||${h.sku || ''}||${h.specification || ''}||${h.color || ''}||${h.size || ''}||${h.salesUnit || ''}||${h.unitSize || ''}||${h.pricePerUnit || 0}`;
    hongMap.set(detailedKey, h._count.id);
  }

  // Aggregate by supplier + subSku (in case there are duplicates)
  const map = new Map<string, {
    supplier: string;
    subSku: string;
    productName: string;
    sku: string;
    specification: string;
    nhapKho: number;
    xuatKho: number;
    tonKho: number;
    tonThucTe: number;
    tonKhaDung: number;
    daGiuDon: number;
    loi: number;
    hong: number;
    minStock: number;
    createdAt: string;
    color: string;
    size: string;
    salesUnit: string;
    unitSize: string;
    pricePerUnit: number;
    pricingCount: number;
    costPriceLatest: number;
    costPriceAverage: number;
  }>();

  for (const p of declaredProducts) {
    const supplier = p.supplier || '';
    const subSku = p.subSku || '';
    const key = (supplier || subSku) ? `${supplier}||${subSku}` : `BLANK||${p.productName}||${p.sku}`;

    if (!map.has(key)) {
      map.set(key, {
        supplier,
        subSku,
        productName: p.productName || '',
        sku: p.sku || '',
        specification: p.specification || '',
        nhapKho: 0,
        xuatKho: 0,
        tonKho: 0,
        tonThucTe: 0,
        tonKhaDung: 0,
        daGiuDon: 0,
        loi: 0,
        hong: 0,
        minStock: 0,
        createdAt: p.createdAt.toISOString(),
        color: p.color || '',
        size: p.size || '',
        salesUnit: p.salesUnit || '',
        unitSize: p.unitSize || '',
        pricePerUnit: p.pricePerUnit || 0,
        pricingCount: pricingCountMap.get(p.sku || '') || 0,
        costPriceLatest: 0,
        costPriceAverage: 0,
      });
    }
    const entry = map.get(key)!;
    // Use the latest non-zero values (last import wins)
    if (p.nhapKho > 0 || p.xuatKho > 0 || p.tonKho > 0) {
      entry.nhapKho = p.nhapKho;
      entry.xuatKho = p.xuatKho;
      entry.tonKho = p.tonKho;
    }
    // Keep the latest createdAt and minStock
    if (p.createdAt.toISOString() >= entry.createdAt) {
      entry.createdAt = p.createdAt.toISOString();
      if (p.minStock !== undefined) entry.minStock = p.minStock;
    }
  }

  // Aggregate physical rolls groups
  for (const rg of rollGroups) {
    const supplier = rg.supplier || '';
    const subSku = rg.subSku || '';
    const key = (supplier || subSku) ? `${supplier}||${subSku}` : `BLANK||${rg.productName}||${rg.sku}`;

    if (!map.has(key)) {
      map.set(key, {
        supplier,
        subSku,
        productName: rg.productName || '',
        sku: rg.sku || '',
        specification: rg.specification || '',
        nhapKho: 0,
        xuatKho: 0,
        tonKho: 0,
        tonThucTe: 0,
        tonKhaDung: 0,
        daGiuDon: 0,
        loi: 0,
        hong: 0,
        minStock: 0,
        createdAt: new Date().toISOString(),
        color: rg.color || '',
        size: rg.size || '',
        salesUnit: rg.salesUnit || '',
        unitSize: rg.unitSize || '',
        pricePerUnit: rg.pricePerUnit || 0,
        pricingCount: pricingCountMap.get(rg.sku || '') || 0,
        costPriceLatest: 0,
        costPriceAverage: 0,
      });
    }
    const entry = map.get(key)!;
    const count = rg._count.id;

    if (rg.status === 'trong_kho' || rg.status === 'da_giu_cho_don') {
      entry.tonThucTe += count;
    }
    if (rg.status === 'trong_kho') {
      entry.tonKhaDung += count;
    }
    if (rg.status === 'da_giu_cho_don') {
      entry.daGiuDon += count;
    }
    if (rg.status === 'loi_hong') {
      const detailedKey = `${rg.supplier || ''}||${rg.subSku || ''}||${rg.productName || ''}||${rg.sku || ''}||${rg.specification || ''}||${rg.color || ''}||${rg.size || ''}||${rg.salesUnit || ''}||${rg.unitSize || ''}||${rg.pricePerUnit || 0}`;
      const hongCount = hongMap.get(detailedKey) || 0;
      entry.hong += hongCount;
      entry.loi += Math.max(0, count - hongCount);
    }
  }

  // Track costPrice details per key
  const batchPriceMap = new Map<string, { latestCreatedAt: Date | null; latestCostPrice: number; totalCost: number; totalQty: number }>();
  for (const p of declaredProducts) {
    const supplier = p.supplier || '';
    const subSku = p.subSku || '';
    const key = (supplier || subSku) ? `${supplier}||${subSku}` : `BLANK||${p.productName}||${p.sku}`;

    if (!batchPriceMap.has(key)) {
      batchPriceMap.set(key, { latestCreatedAt: null, latestCostPrice: 0, totalCost: 0, totalQty: 0 });
    }
    const bpm = batchPriceMap.get(key)!;
    const cp = p.costPrice || 0;
    const qty = p.quantity || 0;

    if (cp > 0) {
      bpm.totalCost += cp * qty;
      bpm.totalQty += qty;

      if (!bpm.latestCreatedAt || p.createdAt > bpm.latestCreatedAt) {
        bpm.latestCreatedAt = p.createdAt;
        bpm.latestCostPrice = cp;
      }
    }
  }

  for (const entry of map.values()) {
    const key = (entry.supplier || entry.subSku) ? `${entry.supplier}||${entry.subSku}` : `BLANK||${entry.productName}||${entry.sku}`;
    const bpm = batchPriceMap.get(key);
    if (bpm) {
      entry.costPriceLatest = bpm.latestCostPrice;
      entry.costPriceAverage = bpm.totalQty > 0 ? Math.round(bpm.totalCost / bpm.totalQty) : bpm.latestCostPrice;
    }
  }

  const result = Array.from(map.values()).sort((a, b) => {
    const cmp = a.supplier.localeCompare(b.supplier);
    return cmp !== 0 ? cmp : a.subSku.localeCompare(b.subSku);
  });

  sendSuccess(res, result);
});

/**
 * GET /api/inventory/lookup-subsku?q=...
 * Search ImportBatch by subSku (contains), return unique product info
 */
export const lookupSubSku = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (!q || q.length < 2) {
    sendSuccess(res, []);
    return;
  }

  const batches = await prisma.importBatch.findMany({
    where: { 
      OR: [
        { subSku: { contains: q } },
        { sku: { contains: q } }
      ]
    },
    select: { subSku: true, sku: true, productName: true, specification: true, supplier: true, color: true, otherSpecs: true, costPrice: true }
  });

  // Deduplicate by subSku
  const map = new Map<string, any>();
  for (const b of batches) {
    if (b.subSku && !map.has(b.subSku)) {
      map.set(b.subSku, b);
    }
  }

  sendSuccess(res, Array.from(map.values()));
});

/**
 * GET /api/inventory/by-sku?skus=SKU1,SKU2
 * Fetch inventory items that match the given SKUs.
 */
export const getInventoryBySku = asyncHandler(async (req: AuthRequest, res: Response) => {
  const skusStr = String(req.query.skus || '').trim();
  if (!skusStr) {
    return sendSuccess(res, []);
  }

  const skus = skusStr.split(',').map(s => s.trim()).filter(Boolean);

  if (skus.length === 0) {
    return sendSuccess(res, []);
  }

  const batches = await prisma.importBatch.findMany({
    where: {
      sku: { in: skus }
    },
    select: { subSku: true, sku: true, productName: true, specification: true, supplier: true, tonKho: true }
  });

  // Deduplicate by subSku
  const map = new Map<string, any>();
  for (const b of batches) {
    if (b.subSku && !map.has(b.subSku)) {
      map.set(b.subSku, b);
    }
  }

  sendSuccess(res, Array.from(map.values()));
});
