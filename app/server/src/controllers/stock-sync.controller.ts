import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import crypto from 'crypto';

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
      createdAt: true,
    }
  });

  // Fetch physical rolls with their scan history to calculate real stock
  const physicalRolls = await prisma.productRoll.findMany({
    select: {
      supplier: true,
      subSku: true,
      productName: true,
      sku: true,
      specification: true,
      status: true,
      scanHistory: {
        select: { action: true }
      }
    }
  });

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
    createdAt: string;
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
        createdAt: p.createdAt.toISOString(),
      });
    }
    const entry = map.get(key)!;
    // Use the latest non-zero values (last import wins)
    if (p.nhapKho > 0 || p.xuatKho > 0 || p.tonKho > 0) {
      entry.nhapKho = p.nhapKho;
      entry.xuatKho = p.xuatKho;
      entry.tonKho = p.tonKho;
    }
    // Keep the latest createdAt
    if (p.createdAt.toISOString() > entry.createdAt) {
      entry.createdAt = p.createdAt.toISOString();
    }
  }

  // Aggregate physical rolls
  for (const r of physicalRolls) {
    const supplier = r.supplier || '';
    const subSku = r.subSku || '';
    const key = (supplier || subSku) ? `${supplier}||${subSku}` : `BLANK||${r.productName}||${r.sku}`;

    if (!map.has(key)) {
      map.set(key, {
        supplier,
        subSku,
        productName: r.productName || '',
        sku: r.sku || '',
        specification: r.specification || '',
        nhapKho: 0,
        xuatKho: 0,
        tonKho: 0,
        tonThucTe: 0,
        tonKhaDung: 0,
        daGiuDon: 0,
        loi: 0,
        hong: 0,
        createdAt: new Date().toISOString(),
      });
    }
    const entry = map.get(key)!;

    if (r.status === 'trong_kho' || r.status === 'da_giu_cho_don') {
      entry.tonThucTe++;
    }
    if (r.status === 'trong_kho') {
      entry.tonKhaDung++;
    }
    if (r.status === 'da_giu_cho_don') {
      entry.daGiuDon++;
    }
    if (r.status === 'loi_hong') {
      let isHong = false;
      let isLoi = false;
      for (const scan of r.scanHistory) {
        if (scan.action.includes('Hàng hỏng')) isHong = true;
        else if (scan.action.includes('Hàng lỗi')) isLoi = true;
      }
      if (isHong) entry.hong++;
      else entry.loi++; // Default to loi
    }
  }

  const result = Array.from(map.values()).sort((a, b) => {
    const cmp = a.supplier.localeCompare(b.supplier);
    return cmp !== 0 ? cmp : a.subSku.localeCompare(b.subSku);
  });

  sendSuccess(res, result);
});


/**
 * POST /api/inventory/sync-stock
 * Import Excel (from Google Sheets) with columns: XƯỞNG, SUB-SKU, NHẬP KHO, XUẤT KHO, TỒN
 * Matching condition: XƯỞNG + SUB-SKU must both match an existing ProductRoll
 * Updates stockQuantity in the database accordingly
 */
export const syncStock = asyncHandler(async (req: AuthRequest, res: Response) => {
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
    sendError(res, 'File Excel trống — không có dữ liệu', 400);
    return;
  }

  // Normalize Unicode keys from Excel (Google Sheets exports may use NFD vs NFC)
  // This prevents invisible character mismatches for Vietnamese headers like XƯỞNG, NHẬP KHO, etc.
  const normalizeKey = (k: string) => k.normalize('NFC').trim();
  const rows: Record<string, any>[] = rawRows.map(row => {
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      normalized[normalizeKey(key)] = row[key];
    }
    return normalized;
  });

  // Validate columns
  const firstRow = rows[0];
  const hasSupplier = ('XƯỞNG' in firstRow) || ('supplier' in firstRow);
  const hasSubSku = ('SUB-SKU' in firstRow) || ('sub_sku' in firstRow) || ('subSku' in firstRow);

  if (!hasSupplier || !hasSubSku) {
    // Debug: expose actual keys to help diagnose future issues
    const actualKeys = Object.keys(firstRow).join(', ');
    sendError(res, `File thiếu cột bắt buộc: XƯỞNG và SUB-SKU. Cột hiện có: [${actualKeys}]`, 400);
    return;
  }

  interface SyncRow {
    rowNum: number;
    supplier: string;
    subSku: string;
    nhapKho: number;
    xuatKho: number;
    tonKho: number;
  }
  interface RowError { row: number; message: string }

  const errors: RowError[] = [];
  const validRows: SyncRow[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const supplier = String(row['XƯỞNG'] || row.supplier || '').trim();
    const subSku = String(row['SUB-SKU'] || row.sub_sku || row.subSku || '').trim();
    const nhapKho = Number(row['NHẬP KHO'] || row.nhapKho || 0);
    const xuatKho = Number(row['XUẤT KHO'] || row.xuatKho || 0);
    const tonKho = Number(row['TỒN'] || row.tonKho || 0);

    if (!supplier && !subSku) return; // skip empty rows

    if (!supplier) {
      errors.push({ row: rowNum, message: 'Thiếu XƯỞNG' });
      return;
    }
    if (!subSku) {
      errors.push({ row: rowNum, message: 'Thiếu SUB-SKU' });
      return;
    }

    validRows.push({ rowNum, supplier, subSku, nhapKho, xuatKho, tonKho });
  });

  if (validRows.length === 0) {
    sendSuccess(res, {
      summary: { totalRows: rows.length, matched: 0, notFound: 0, updated: 0 },
      errors,
      details: [],
    }, 200, 'Không có dòng nào hợp lệ');
    return;
  }

  // Process each row: find matching rolls and update
  const details: { row: number; supplier: string; subSku: string; status: string; oldQty: number; newQty: number }[] = [];
  let matchedCount = 0;
  let notFoundCount = 0;
  let updatedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      // Find matching ImportBatch by supplier + subSku
      const batchDef = await tx.importBatch.findFirst({
        where: { supplier: row.supplier, subSku: row.subSku },
        orderBy: { createdAt: 'desc' },
      });

      if (!batchDef) {
        notFoundCount++;
        errors.push({
          row: row.rowNum,
          message: `Không tìm thấy sản phẩm: XƯỞNG="${row.supplier}" + SUB-SKU="${row.subSku}"`,
        });
        continue;
      }

      matchedCount++;

      const oldNhap = batchDef.nhapKho;
      const oldXuat = batchDef.xuatKho;
      const oldTon = batchDef.tonKho;

      // Update nhapKho, xuatKho, tonKho directly on ImportBatch
      await tx.importBatch.update({
        where: { id: batchDef.id },
        data: {
          nhapKho: row.nhapKho,
          xuatKho: row.xuatKho,
          tonKho: row.tonKho,
        },
      });

      const changed = oldNhap !== row.nhapKho || oldXuat !== row.xuatKho || oldTon !== row.tonKho;
      if (changed) {
        updatedCount++;
        details.push({
          row: row.rowNum,
          supplier: row.supplier,
          subSku: row.subSku,
          status: 'updated',
          oldQty: oldTon,
          newQty: row.tonKho,
        });
      } else {
        details.push({
          row: row.rowNum,
          supplier: row.supplier,
          subSku: row.subSku,
          status: 'unchanged',
          oldQty: oldTon,
          newQty: row.tonKho,
        });
      }
    }
  });

  const io = req.app.get('io');
  if (io) io.emit('inventory_updated', { type: 'stock_sync' });

  sendSuccess(res, {
    summary: {
      totalRows: rows.length,
      matched: matchedCount,
      notFound: notFoundCount,
      updated: updatedCount,
    },
    errors,
    details,
  }, 200, `Đồng bộ xong: ${matchedCount} khớp, ${updatedCount} cập nhật, ${notFoundCount} không tìm thấy`);
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
    select: { subSku: true, sku: true, productName: true, specification: true, supplier: true, col