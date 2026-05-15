/**
 * Customer Pricing Import Controller
 * ─────────────────────────────────────────────────────────
 * Import bổ sung (lần 2): Thêm giá bán theo khách hàng + SKU.
 *   GET  /api/customers/pricing-template   → download Excel template
 *   POST /api/customers/import-pricing     → parse + validate + upsert pricing
 *   GET  /api/customers/:id/pricing        → get pricing rules for a customer
 *   GET  /api/customers/export-pricing      → export all pricing to Excel
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

// ═══════════════════════════════════════════════════════
// GET /api/customers/pricing-template
// ═══════════════════════════════════════════════════════

export const downloadPricingTemplate = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const XLSX = await import('xlsx');

  const templateData = [
    {
      'MÃ KHÁCH HÀNG': 'KH-0001',
      'TÊN KHÁCH HÀNG': 'Công ty ABC',
      'SKU': 'BWP-TH-BLACK-4inch',
      'GIÁ BÁN': 150000,
    },
    {
      'MÃ KHÁCH HÀNG': 'KH-0001',
      'TÊN KHÁCH HÀNG': 'Công ty ABC',
      'SKU': 'BWP-TK-WHITE-4inch',
      'GIÁ BÁN': 200000,
    },
    {
      'MÃ KHÁCH HÀNG': 'KH-0002',
      'TÊN KHÁCH HÀNG': 'Trần Thị B',
      'SKU': 'BWP-TH-BLACK-4inch',
      'GIÁ BÁN': 180000,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 20 }, // MÃ KHÁCH HÀNG
    { wch: 30 }, // TÊN KHÁCH HÀNG
    { wch: 30 }, // SKU
    { wch: 15 }, // GIÁ BÁN
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pricing Template');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="pricing_import_template.xlsx"');
  res.send(buffer);
});

// ═══════════════════════════════════════════════════════
// POST /api/customers/import-pricing
// ═══════════════════════════════════════════════════════

const PRICING_COLUMN_MAP: Record<string, string> = {
  'mã khách hàng': 'customerCode',
  'ma khach hang': 'customerCode',
  'customer code': 'customerCode',
  'customercode': 'customerCode',

  'tên khách hàng': 'customerName',
  'ten khach hang': 'customerName',
  'customer name': 'customerName',
  'customername': 'customerName',

  'sku': 'sku',
  'mã sku': 'sku',
  'ma sku': 'sku',

  'giá bán': 'price',
  'gia ban': 'price',
  'price': 'price',
  'đơn giá': 'price',
  'don gia': 'price',
  'unit price': 'price',
};

function getVal(row: Record<string, any>, canonical: string): string {
  // Direct key match in map
  for (const [raw, mapped] of Object.entries(PRICING_COLUMN_MAP)) {
    if (mapped === canonical && raw in row) {
      return String(row[raw] || '').trim();
    }
  }
  // Case-insensitive match
  for (const key of Object.keys(row)) {
    const mapped = PRICING_COLUMN_MAP[key.toLowerCase().trim()];
    if (mapped === canonical) return String(row[key] || '').trim();
  }
  return '';
}

export const importPricing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const XLSX = await import('xlsx');
  const { fileBase64 } = req.body as { fileBase64: string };

  if (!fileBase64) {
    sendError(res, 'fileBase64 is required', 400);
    return;
  }

  let workbook;
  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    sendError(res, 'File không hợp lệ. Vui lòng upload file .xlsx', 400);
    return;
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    sendError(res, 'File Excel trống', 400);
    return;
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rawRows.length === 0) {
    sendError(res, 'File không có dữ liệu', 400);
    return;
  }

  if (rawRows.length > 5000) {
    sendError(res, `Tối đa 5000 dòng. File có ${rawRows.length} dòng.`, 400);
    return;
  }

  // Parse rows — keep last duplicate (code+sku) per spec
  interface PricingRow {
    rowNum: number;
    customerCode: string;
    customerName: string;
    sku: string;
    price: number;
  }
  interface RowError { row: number; message: string }

  const errors: RowError[] = [];
  const rowMap = new Map<string, PricingRow>(); // key: code|sku → last wins

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const customerCode = getVal(row, 'customerCode');
    const customerName = getVal(row, 'customerName');
    const sku = getVal(row, 'sku');
    const priceStr = getVal(row, 'price');

    // Skip blank
    if (!customerCode && !customerName && !sku) return;

    if (!customerCode) {
      errors.push({ row: rowNum, message: 'Thiếu MÃ KHÁCH HÀNG' });
      return;
    }
    if (!customerName) {
      errors.push({ row: rowNum, message: 'Thiếu TÊN KHÁCH HÀNG' });
      return;
    }
    if (!sku) {
      errors.push({ row: rowNum, message: 'Thiếu SKU' });
      return;
    }

    const price = Number(priceStr.replace(/[,\s]/g, ''));
    if (isNaN(price) || price < 0) {
      errors.push({ row: rowNum, message: `GIÁ BÁN không hợp lệ: "${priceStr}"` });
      return;
    }

    // Last duplicate wins
    const key = `${customerCode.toUpperCase()}|${sku.toUpperCase()}`;
    rowMap.set(key, { rowNum, customerCode, customerName, sku, price });
  });

  const validRows = Array.from(rowMap.values());

  if (validRows.length === 0) {
    sendSuccess(res, {
      summary: { totalRows: rawRows.length, success: 0, failed: errors.length, skipped: 0 },
      errors,
    }, 200, 'Không có dòng nào hợp lệ');
    return;
  }

  // Process: find customer by code+name, upsert pricing
  let success = 0;
  let skipped = 0;

  // Pre-fetch all unique customer codes
  const uniqueCodes = [...new Set(validRows.map(r => r.customerCode))];
  const customers = await prisma.customer.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true, code: true, name: true },
  });

  const customerMap = new Map(customers.map(c => [c.code.toUpperCase(), c]));

  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const customer = customerMap.get(row.customerCode.toUpperCase());

      if (!customer) {
        errors.push({ row: row.rowNum, message: `Không tìm thấy khách hàng: ${row.customerCode}` });
        skipped++;
        continue;
      }

      // Verify name matches (case-insensitive, trimmed)
      if (customer.name.toLowerCase().trim() !== row.customerName.toLowerCase().trim()) {
        errors.push({
          row: row.rowNum,
          message: `Tên KH không khớp: code=${row.customerCode}, Excel="${row.customerName}", DB="${customer.name}"`,
        });
        skipped++;
        continue;
      }

      // Upsert pricing rule
      await tx.customerPricing.upsert({
        where: {
          customerId_sku: {
            customerId: customer.id,
            sku: row.sku,
          },
        },
        update: {
          price: row.price,
          updatedBy: req.user!.uid,
          updatedByName: req.user!.name || req.user!.email,
        },
        create: {
          customerId: customer.id,
          sku: row.sku,
          price: row.price,
          updatedBy: req.user!.uid,
          updatedByName: req.user!.name || req.user!.email,
        },
      });
      success++;
    }
  });

  // Activity log
  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid,
      email: req.user!.email,
      action: 'Import pricing (Excel)',
      module: 'Khách hàng',
      description: `Imported pricing: ${success} success, ${skipped} skipped, ${errors.length} errors`,
    },
  });

  const io = req.app.get('io');
  if (io) io.emit('customer_updated', { type: 'pricing_import', success, skipped });

  sendSuccess(res, {
    summary: {
      totalRows: rawRows.length,
      success,
      failed: errors.length,
      skipped,
    },
    errors,
  }, 201, `Import giá bán: ${success} thành công, ${skipped} bỏ qua`);
});

// ═══════════════════════════════════════════════════════
// GET /api/customers/:id/pricing
// ═══════════════════════════════════════════════════════

export const getCustomerPricing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const pricing = await prisma.customerPricing.findMany({
    where: { customerId: id },
    orderBy: { updatedAt: 'desc' },
  });
  sendSuccess(res, pricing);
});

// ═══════════════════════════════════════════════════════
// GET /api/customers/export-pricing
// ═══════════════════════════════════════════════════════

export const exportPricing = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const XLSX = await import('xlsx');

  const allPricing = await prisma.customerPricing.findMany({
    include: { customer: { select: { code: true, name: true } } },
    orderBy: [{ customer: { code: 'asc' } }, { sku: 'asc' }],
  });

  const exportData = allPricing.map(p => ({
    'MÃ KHÁCH HÀNG': p.customer.code,
    'TÊN KHÁCH HÀNG': p.customer.name,
    'SKU': p.sku,
    'GIÁ BÁN': p.price,
    'Cập nhật lần cuối': p.updatedAt.toLocaleDateString('vi-VN'),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bảng giá khách hàng');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="customer_pricing_${new Date().toISOString().slice(0, 10)}.xlsx"`);
  res.send(buffer);
});

// ═══════════════════════════════════════════════════════
// PUT /api/customers/pricing/:pricingId
// ═══════════════════════════════════════════════════════

export const updatePricingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pricingId } = req.params;
  const { price } = req.body as { price: number };

  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    sendError(res, 'Giá bán không hợp lệ', 400);
    return;
  }

  const existing = await prisma.customerPricing.findUnique({ where: { id: pricingId } });
  if (!existing) {
    sendError(res, 'Không tìm thấy pricing rule', 404);
    return;
  }

  const updated = await prisma.customerPricing.update({
    where: { id: pricingId },
    data: {
      price: Number(price),
      updatedBy: req.user!.uid,
      updatedByName: req.user!.name || req.user!.email,
    },
  });

  // Activity log
  await prisma.customerActivity.create({
    data: {
      customerId: existing.customerId,
      type: 'pricing_update',
      title: `Cập nhật giá SKU: ${existing.sku}`,
      description: `${existing.price} → ${price} (bởi ${req.user!.name || req.user!.email})`,
      createdBy: req.user!.uid,
      createdByName: req.user!.name || req.user!.email,
    },
  });

  const io = req.app.get('io');
  if (io) io.emit('customer_updated', { type: 'pricing_update', pricingId });

  sendSuccess(res, updated, 200, 'Cập nhật giá thành công');
});

// ═══════════════════════════════════════════════════════
// PATCH /api/customers/pricing/:pricingId/toggle
// ═══════════════════════════════════════════════════════

export const togglePricingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pricingId } = req.params;

  const existing = await prisma.customerPricing.findUnique({ where: { id: pricingId } });
  if (!existing) {
    sendError(res, 'Không tìm thấy pricing rule', 404);
    return;
  }

  const updated = await prisma.customerPricing.update({
    where: { id: pricingId },
    data: { isActive: !existing.isActive },
  });

  const io = req.app.get('io');
  if (io) io.emit('customer_updated', { type: 'pricing_toggle', pricingId });

  sendSuccess(res, updated, 200, updated.isActive ? 'Đã kích hoạt' : 'Đã dừng bán');
});

// ═══════════════════════════════════════════════════════
// POST /api/customers/:id/pricing
// ═══════════════════════════════════════════════════════

export const addPricingRule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { sku, price } = req.body as { sku: string; price: number };

  if (!sku?.trim()) { sendError(res, 'SKU không được trống', 400); return; }
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    sendError(res, 'Giá bán không hợp lệ', 400); return;
  }

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) { sendError(res, 'Không tìm thấy khách hàng', 404); return; }

  const rule = await prisma.customerPricing.upsert({
    where: { customerId_sku: { customerId: id, sku: sku.trim() } },
    update: {
      price: Number(price),
      isActive: true,
      updatedBy: req.user!.uid,
      updatedByName: req.user!.name || req.user!.email,
    },
    create: {
      customerId: id,
      sku: sku.trim(),
      price: Number(price),
      isActive: true,
      updatedBy: req.user!.uid,
      updatedByName: req.user!.name || req.user!.email,
    },
  });

  const io = req.app.get('io');
  if (io) io.emit('customer_updated', { type: 'pricing_add', customerId: id });

  sendSuccess(res, rule, 201, 'Thêm SKU thành công');
});

// ═══════════════════════════════════════════════════════
// PATCH /api/customers/:id/subsku-toggle
// Body: { subSku: string }
// ═══════════════════════════════════════════════════════

export const toggleSubSku = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { subSku } = req.body as { subSku: string };

  if (!subSku?.trim()) { sendError(res, 'subSku is required', 400); return; }

  // Upsert: create if not exists, toggle if exists
  const existing = await prisma.customerSubSkuStatus.findUnique({
    where: { customerId_subSku: { customerId: id, subSku: subSku.trim() } },
  });

  let result;
  if (existing) {
    result = await prisma.customerSubSkuStatus.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
    });
  } else {
    // First toggle = deactivate (default is active, so toggling = set to false)
    result = await prisma.customerSubSkuStatus.create({
      data: { customerId: id, subSku: subSku.trim(), isActive: false },
    });
  }

  const io = req.app.get('io');
  if (io) io.emit('customer_updated', { type: 'subsku_toggle', customerId: id, subSku });

  sendSuccess(res, result, 200, result.isActive ? 'Đã kích hoạt SUB-SKU' : 'Đã dừng bán SUB-SKU');
});

// ═══════════════════════════════════════════════════════
// GET /api/customers/:id/subsku-status
// ═══════════════════════════════════════════════════════

export const getSubSkuStatuses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const statuses = await prisma.customerSubSkuStatus.findMany({
    where: { customerId: id },
  });
  sendSuccess(res, statuses);
});
