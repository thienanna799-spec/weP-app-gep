import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/**
 * PUT /api/inventory/stock-summary/:subSku/min-stock
 * Update minStock for all ImportBatches with the given subSku
 */
export const updateMinStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subSku } = req.params;
  const { minStock } = req.body;

  if (typeof minStock !== 'number') {
    sendError(res, 'minStock must be a number', 400);
    return;
  }

  // Update all matching batches
  await prisma.importBatch.updateMany({
    where: { subSku },
    data: { minStock },
  });

  const io = req.app.get('io');
  if (io) io.emit('inventory_updated', { type: 'min_stock_update', subSku, minStock });

  sendSuccess(res, { subSku, minStock }, 200, 'Cập nhật mức cảnh báo thành công');
});

/**
 * PUT /api/inventory/product-info
 * Update product info (color, size, price, etc.) for all ImportBatches and ProductRolls matching supplier + subSku
 */
export const updateProductInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { supplier, subSku, productName, sku, specification, color, size, salesUnit, unitSize, costPrice } = req.body;

  if (!supplier || !subSku) {
    sendError(res, 'Thiếu XƯỞNG (supplier) hoặc SUB-SKU', 400);
    return;
  }

  const updateData = {
    ...(productName !== undefined && { productName }),
    ...(sku !== undefined && { sku }),
    ...(specification !== undefined && { specification }),
    ...(color !== undefined && { color }),
    ...(size !== undefined && { size }),
    ...(salesUnit !== undefined && { salesUnit }),
    ...(unitSize !== undefined && { unitSize }),
    ...(costPrice !== undefined && { costPrice }),
  };

  if (Object.keys(updateData).length === 0) {
    sendError(res, 'Không có dữ liệu để cập nhật', 400);
    return;
  }

  await prisma.$transaction([
    prisma.importBatch.updateMany({
      where: { supplier, subSku },
      data: updateData,
    }),
    prisma.productRoll.updateMany({
      where: { supplier, subSku },
      data: updateData,
    })
  ]);

  const io = req.app.get('io');
  if (io) io.emit('inventory_updated', { type: 'product_info_update', supplier, subSku });

  sendSuccess(res, { supplier, subSku, ...updateData }, 200, 'Cập nhật thông tin sản phẩm thành công');
});

/**
 * GET /api/inventory/product-pricing?sku=...
 * Fetch customer pricing for a specific sku
 */
export const getProductPricing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sku } = req.query;

  if (!sku) {
    sendSuccess(res, []);
    return;
  }

  const pricings = await prisma.customerPricing.findMany({
    where: { sku: String(sku), isActive: true },
    include: {
      customer: {
        select: { name: true, code: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  sendSuccess(res, pricings);
});
