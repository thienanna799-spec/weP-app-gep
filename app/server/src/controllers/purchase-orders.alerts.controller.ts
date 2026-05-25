import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { MaterialStatus } from '../types/enums.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { sendTelegramMessage } from '../services/telegram.service.js';
import { recordPurchaseOrderEvent } from '../services/orderTracking.service.js';

/** GET /api/materials/low-stock — Danh sách NVL dưới mức tối thiểu */
export const getLowStockMaterials = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const materials = await prisma.material.findMany({
    where: {
      OR: [
        { status: MaterialStatus.sap_het },
        { status: MaterialStatus.het_hang },
      ],
    },
    orderBy: { currentStock: 'asc' },
    select: {
      id: true, code: true, name: true, group: true, unit: true,
      currentStock: true, minStock: true, purchasePrice: true, supplier: true,
    },
  });
  sendSuccess(res, materials);
});

/** POST /api/materials/low-stock/alert — Send low stock Telegram alert to staff */
export const sendLowStockAlert = asyncHandler(async (req: AuthRequest, res: Response) => {
  const materials = await prisma.material.findMany({
    where: {
      OR: [
        { status: MaterialStatus.sap_het },
        { status: MaterialStatus.het_hang },
      ],
    },
    orderBy: { currentStock: 'asc' },
    select: { id: true, code: true, name: true, currentStock: true, minStock: true, unit: true },
  });

  if (materials.length === 0) {
    return sendSuccess(res, { alertsSent: 0, message: 'Không có NVL nào sắp hết' });
  }

  const chatId = process.env.TELEGRAM_STAFF_CHAT_ID;
  if (!chatId) {
    return sendSuccess(res, { alertsSent: 0, message: 'TELEGRAM_STAFF_CHAT_ID chưa được cấu hình' });
  }

  let msg = `⚠️ <b>Cảnh báo NVL sắp hết</b>\n\n`;
  for (const m of materials) {
    const emoji = m.currentStock <= 0 ? '🔴' : '🟡';
    msg += `${emoji} <b>${m.name}</b>: ${m.currentStock}/${m.minStock} ${m.unit}\n`;
  }
  msg += `\n📋 Tổng: ${materials.length} NVL cần bổ sung\n`;
  msg += `<i>Vui lòng tạo đơn mua hàng PO.</i>`;

  const sent = await sendTelegramMessage(chatId, msg);

  // Log notification
  try {
    await prisma.notificationLog.create({
      data: {
        type: 'low_stock', channel: 'telegram', recipient: chatId,
        subject: `Cảnh báo ${materials.length} NVL sắp hết`,
        content: msg, status: sent ? 'sent' : 'failed',
        relatedType: 'material',
      },
    });
  } catch { /* ignore */ }

  sendSuccess(res, { alertsSent: sent ? 1 : 0, materialCount: materials.length, message: sent ? 'Đã gửi cảnh báo NVL' : 'Gửi thất bại' });
});

/** POST /api/materials/:id/suggest-po — Tự động tạo PO draft từ NVL */
export const suggestPurchaseOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const material = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!material) { sendError(res, 'Material not found', 404); return; }

  // Find supplier
  let supplier = null;
  if (material.supplier) {
    supplier = await prisma.supplier.findFirst({
      where: { name: { contains: material.supplier }, isActive: true },
    });
  }

  // Calculate suggested quantity: (minStock * 2) - currentStock
  const suggestedQty = Math.max(material.minStock * 2 - material.currentStock, material.minStock);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const dayCount = await prisma.purchaseOrder.count({
    where: { code: { startsWith: `PO-${today}` } },
  });
  const code = `PO-${today}-${String(dayCount + 1).padStart(3, '0')}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      code,
      supplierId: supplier?.id || '',
      totalAmount: suggestedQty * material.purchasePrice,
      createdBy: req.user!.uid,
      createdByName: req.user!.name,
      notes: `Tự động đề xuất: ${material.name} đang ở mức ${material.currentStock}/${material.minStock}`,
      items: {
        create: {
          materialId: material.id,
          materialName: material.name,
          quantity: suggestedQty,
          unitPrice: material.purchasePrice,
          unit: material.unit,
        },
      },
    },
    include: { items: true },
  });

  await recordPurchaseOrderEvent(po.id, {
    actionType: 'CREATE',
    action: 'Tự động tạo PO từ cảnh báo NVL sắp hết',
    operator: req.user!.name || req.user!.uid,
    toStatus: po.status,
    metadata: { materialId: material.id, suggestedQty }
  });

  sendSuccess(res, po, 201, `Đã tạo PO gợi ý cho ${material.name}`);
});
