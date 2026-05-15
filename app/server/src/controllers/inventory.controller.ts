/**
 * Advanced Inventory Controller
 * ─────────────────────────────
 * Handles Stocktake (Kiểm kê) and Internal Transfers (Chuyển kho).
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { inventoryExportService } from '../services/inventory.export.service.js';

function emitSync(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

// ── Internal Transfers ─────────────────────────────────────

export const getTransfers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const transfers = await prisma.internalTransfer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  sendSuccess(res, transfers);
});

export const createTransfer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fromLocation, toLocation, notes, rollCodes } = req.body;
  if (!fromLocation || !toLocation || !rollCodes || !rollCodes.length) {
    return sendError(res, 'Missing required fields', 400);
  }

  const code = `TRF-${Date.now().toString().slice(-6)}`;
  
  const transfer = await prisma.$transaction(async (tx) => {
    const trf = await tx.internalTransfer.create({
      data: {
        code, fromLocation, toLocation, notes,
        createdBy: req.user!.uid, createdByName: req.user!.name || 'System',
      },
    });

    const itemsData = [];
    for (const rollCode of rollCodes) {
      const roll = await tx.productRoll.findUnique({ where: { code: rollCode } });
      if (!roll) throw new Error(`Roll not found: ${rollCode}`);

      itemsData.push({
        internalTransferId: trf.id,
        rollId: roll.id,
        rollCode: roll.code,
      });

      // Update roll location
      await tx.productRoll.update({
        where: { id: roll.id },
        data: { positionArea: toLocation }, // simplistic approach
      });

      // Scan history
      await tx.rollScanHistory.create({
        data: {
          rollId: roll.id,
          action: `Chuyển kho: ${fromLocation} -> ${toLocation}`,
          operator: req.user!.name || 'System',
        },
      });
    }

    await tx.transferItem.createMany({ data: itemsData });
    return trf;
  });

  emitSync(req, 'inventory_updated', { source: 'transfer' });
  sendSuccess(res, transfer, 201, 'Tạo phiếu chuyển kho thành công');
});

// ── Stocktake ──────────────────────────────────────────────

export const getStocktakes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stocktakes = await prisma.stocktake.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true } } },
  });
  sendSuccess(res, stocktakes);
});

export const getStocktake = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stocktake = await prisma.stocktake.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!stocktake) return sendError(res, 'Stocktake not found', 404);
  sendSuccess(res, stocktake);
});

export const createStocktake = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { warehouse, notes } = req.body;
  const code = `STK-${Date.now().toString().slice(-6)}`;

  const stocktake = await prisma.stocktake.create({
    data: {
      code, warehouse, notes,
      createdBy: req.user!.uid, createdByName: req.user!.name || 'System',
    },
  });

  sendSuccess(res, stocktake, 201, 'Tạo phiếu kiểm kê thành công');
});

export const addStocktakeItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { stocktakeId, rollCode } = req.body;
  const stocktake = await prisma.stocktake.findUnique({ where: { id: stocktakeId } });
  if (!stocktake || stocktake.status !== 'draft') return sendError(res, 'Invalid stocktake', 400);

  const roll = await prisma.productRoll.findUnique({ where: { code: rollCode } });
  if (!roll) return sendError(res, 'Không tìm thấy cuộn', 404);

  // Expected is 1, Actual becomes 1, so difference = 0, status = matched
  const item = await prisma.stocktakeItem.create({
    data: {
      stocktakeId,
      rollId: roll.id,
      rollCode: roll.code,
      productName: roll.productName,
      expectedQty: 1,
      actualQty: 1,
      difference: 0,
      status: 'matched',
    },
  });

  sendSuccess(res, item, 201, 'Thêm chi tiết kiểm kê thành công');
});

export const completeStocktake = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stocktake = await prisma.stocktake.update({
    where: { id: req.params.id },
    data: { status: 'completed' },
  });
  sendSuccess(res, stocktake, 200, 'Hoàn thành kiểm kê');
});

// ── Export ──────────────────────────────────────────────

export const exportInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const buffer = await inventoryExportService.generateStockExcel();
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="inventory-report-${Date.now()}.xlsx"`);
  
  res.status(200).send(buffer);
});
