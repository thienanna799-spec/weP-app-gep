import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import crypto from 'crypto';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** POST /api/inventory/import-batch
 *  Creates an import batch + N rolls with unique QR codes.
 *  Body: { productName, specification?, quantity, supplier?, note?, quickImport?, sku?, subSku?, color?, otherSpecs?, costPrice? }
 *  quickImport=true → rolls are created directly as 'trong_kho' (skip scanning step)
 */
export const createImportBatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productName, specification, quantity, supplier, note, quickImport, sku, subSku, color, otherSpecs, costPrice } = req.body as {
    productName: string;
    specification?: string;
    quantity: number;
    supplier?: string;
    note?: string;
    quickImport?: boolean;
    sku?: string;
    subSku?: string;
    color?: string;
    otherSpecs?: string;
    costPrice?: number;
  };

  if (!productName || quantity === undefined || quantity < 0) {
    sendError(res, 'productName is required and quantity must be >= 0', 400);
    return;
  }

  if (quantity > 10000) {
    sendError(res, 'Maximum 10,000 items per batch', 400);
    return;
  }

  const spec = specification || productName;
  const rollStatus = quickImport ? 'trong_kho' : 'dang_san_xuat';
  const scanAction = quickImport ? 'Nhập kho nhanh (Quick Import)' : 'Khởi tạo cuộn — Nhập hàng ngoài';

  // Remove quantity accumulation logic so that we always generate new QR codes
  // for the user to print and stick on the products, even if quickImport is true.

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.create({
      data: {
        productName,
        sku: sku || null,
        subSku: subSku || null,
        specification: spec,
        color: color || null,
        otherSpecs: otherSpecs || null,
        costPrice: costPrice != null ? costPrice : null,
        quantity,
        nhapKho: quickImport ? quantity : 0,
        tonKho: quickImport ? quantity : 0,
        supplier: supplier || null,
        note: note || null,
        createdBy: req.user!.uid,
        createdByName: req.user!.name,
      },
    });

    const batchShort = batch.id.slice(-6).toUpperCase();
    const now = new Date();

    if (quantity > 0) {
      const rollsData = Array.from({ length: quantity }, (_, i) => {
        const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
        const idx = String(i + 1).padStart(String(quantity).length, '0');
        const qrCode = `IMP-${batchShort}-${idx}-${uuid}`;

        return {
          id: qrCode,
          code: qrCode,
          qrCode,
          productId: `IMPORT-${batch.id}`,
          productName,
          sku: sku || null,
          subSku: subSku || null,
          specification: spec,
          stockQuantity: 1,
          length: 0,
          weight: 0,
          productionDate: now,
          status: rollStatus as any,
          creator: req.user!.uid,
          sourceType: 'manual',
          supplier: supplier || null,
          importBatchId: batch.id,
        };
      });

      await tx.productRoll.createMany({ data: rollsData });

      const scanEntries = rollsData.map((r) => ({
        rollId: r.id,
        action: scanAction,
        operator: req.user!.name,
      }));
      await tx.rollScanHistory.createMany({ data: scanEntries });
    }

    return batch;
  });

  const fullBatch = await prisma.importBatch.findUnique({
    where: { id: result.id },
    include: {
      rolls: {
        select: { id: true, code: true, qrCode: true, productName: true, sku: true, subSku: true, specification: true, status: true, stockQuantity: true },
        orderBy: { code: 'asc' },
      },
      _count: { select: { rolls: true } },
    },
  });

  emitSync(req, 'inventory_updated', { type: 'import_batch_created', batchId: result.id });
  sendSuccess(res, fullBatch, 201, `Đã tạo lô nhập ${quantity} sản phẩm`);
});

/** GET /api/inventory/import-batch
 *  Lists all import batches with roll counts and status summary
 */
export const getImportBatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { rolls: true } },
    },
  });

  // Enrich with status counts
  const enriched = await Promise.all(
    batches.map(async (batch) => {
      const statusCounts = await prisma.productRoll.groupBy({
        by: ['status'],
        where: { importBatchId: batch.id },
        _count: true,
      });
      const statusMap: Record<string, number> = {};
      statusCounts.forEach((s) => {
        statusMap[s.status] = s._count;
      });
      return { ...batch, statusCounts: statusMap };
    })
  );

  sendSuccess(res, enriched);
});

/** GET /api/inventory/import-batch/:id
 *  Single batch detail with all rolls
 */
export const getImportBatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const batch = await prisma.importBatch.findUnique({
    where: { id: req.params.id },
    include: {
      rolls: {
        include: { scanHistory: { orderBy: { timestamp: 'desc' }, take: 1 } },
        orderBy: { code: 'asc' },
      },
      _count: { select: { rolls: true } },
    },
  });

  if (!batch) {
    sendError(res, 'Import batch not found', 404);
    return;
  }

  // Add status summary
  const statusCounts: Record<string, number> = {};
  batch.rolls.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  sendSuccess(res, { ...batch, statusCounts });
});

/** POST /api/inventory/import-batch/:id/done
 *  Marks an import batch as printed/done (hides it from the pending list)
 */
export const markBatchDone = asyncHandler(async (req: AuthRequest, res: Response) => {
  const batch = await prisma.importBatch.findUnique({ where: { id: req.params.id } });
  if (!batch) {
    sendError(res, 'Import batch not found', 404);
    return;
  }
  
  const currentNote = batch.note || '';
  if (currentNote.includes('[PRINTED]')) {
    sendSuccess(res, batch, 200, 'Lô đã được đánh dấu hoàn thành trước đó.');
    return;
  }

  const updatedNote = currentNote ? `${currentNote} [PRINTED]` : '[PRINTED]';
  const updated = await prisma.importBatch.update({
    where: { id: batch.id },
    data: { note: updatedNote },
  });

  emitSync(req, 'inventory_updated', { batchId: updated.id, type: 'batch_done' });
  sendSuccess(res, updated, 200, 'Đã ẩn lô nhập thành công.');
});

/** POST /api/inventory/scan-manual
 *  Scan a manual-import QR code to stock.
 *  Body: { qrCode, quality? }
 *  Reuses the same logic as scanRollToStock but validates it's a manual import roll.
 */
export const scanManualRoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { qrCode, quality } = req.body as { qrCode: string; quality?: string };

  if (!qrCode) {
    sendError(res, 'qrCode is required', 400);
    return;
  }

  const roll = await prisma.productRoll.findUnique({ where: { qrCode } });

  if (!roll) {
    sendError(res, 'Mã QR không tồn tại trong hệ thống', 404);
    return;
  }

  // Allow scanning for manual imports that are still in dang_san_xuat
  if (roll.status !== 'dang_san_xuat') {
    sendError(res, `Cuộn này đã ở trạng thái: ${roll.status}. Không thể nhập kho lại.`, 400);
    return;
  }

  const rollQuality = quality || 'new';
  const isDefective = rollQuality === 'loi' || rollQuality === 'hong';
  const statusToSet = isDefective ? 'loi_hong' : 'trong_kho';
  const qualityLabels: Record<string, string> = { new: 'Hàng mới (OK)', loi: 'Hàng lỗi', hong: 'Hàng hỏng' };
  const qualityLabel = qualityLabels[rollQuality] || 'Hàng mới (OK)';

  const updated = await prisma.productRoll.update({
    where: { id: roll.id },
    data: {
      status: statusToSet as any,
      scanHistory: {
        create: {
          action: `Nhập kho (thủ công) — ${qualityLabel}`,
          operator: req.user!.name,
        },
      },
    },
  });

  emitSync(req, 'inventory_updated', { rollId: updated.id, type: 'manual_scan' });
  sendSuccess(res, updated, 200, `Nhập kho: ${qualityLabel}`);
});

import { ImportBatchExcelService } from '../services/excel.service.js';

/** GET /api/inventory/import-template
 *  Download Excel template for manual import
 */
export const downloadImportTemplate = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const buffer = await ImportBatchExcelService.generateTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="import_template.xlsx"');
  res.send(buffer);
});

/** POST /api/inventory/import-excel
 *  Import inventory from uploaded Excel file.
 *  Body: { fileBase64: string, quickImport?: boolean }
 *  Returns: { batchIds, summary: { totalRows, success, failed }, errors: [] }
 */
export const importExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileBase64, quickImport } = req