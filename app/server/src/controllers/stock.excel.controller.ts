import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

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
    color: string;
    size: string;
    salesUnit: string;
    unitSize: string;
    pricePerUnit: number;
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
    const color = String(row['MÀU SẮC'] || row['COLOR'] || row.color || '').trim();
    const size = String(row['KÍCH THƯỚC'] || row['SIZE'] || row.size || '').trim();
    const salesUnit = String(row['ĐƠN VỊ BÁN'] || row['SALES UNIT'] || row.salesUnit || '').trim();
    const unitSize = String(row['K.THƯỚC Đ.VỊ'] || row['UNIT SIZE'] || row.unitSize || '').trim();
    const pricePerUnit = Number(row['GIÁ/ĐV'] || row['PRICE/UNIT'] || row.pricePerUnit || 0);

    if (!supplier && !subSku) return; // skip empty rows

    if (!supplier) {
      errors.push({ row: rowNum, message: 'Thiếu XƯỞNG' });
      return;
    }
    if (!subSku) {
      errors.push({ row: rowNum, message: 'Thiếu SUB-SKU' });
      return;
    }

    validRows.push({ rowNum, supplier, subSku, nhapKho, xuatKho, tonKho, color, size, salesUnit, unitSize, pricePerUnit });
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
          color: row.color || batchDef.color,
          size: row.size || batchDef.size,
          salesUnit: row.salesUnit || batchDef.salesUnit,
          unitSize: row.unitSize || batchDef.unitSize,
          pricePerUnit: row.pricePerUnit || batchDef.pricePerUnit,
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
