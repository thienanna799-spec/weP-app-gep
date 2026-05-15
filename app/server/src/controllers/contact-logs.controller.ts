import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/** GET /api/orders/:id/contact-logs — List all contact logs for an order */
export const getContactLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await prisma.contactLog.findMany({
    where: { orderId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, logs);
});

/** POST /api/orders/:id/contact-logs — Create a contact log entry */
export const createContactLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const { type, phoneNumber, result, duration, content, method, note, recordingBase64, recordingMimeType } = req.body;

  if (!type || !phoneNumber) {
    sendError(res, 'Thiếu thông tin: type và phoneNumber là bắt buộc', 400);
    return;
  }

  // Verify order exists
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    sendError(res, 'Đơn hàng không tồn tại', 404);
    return;
  }

  const logData: any = {
    orderId,
    type,
    phoneNumber,
    createdBy: req.user!.uid,
    createdByName: req.user!.name || req.user!.email,
  };

  if (type === 'call') {
    logData.result = result || 'connected';
    logData.duration = duration || 0;
    logData.note = note;
    // Store recording as base64 URL
    if (recordingBase64) {
      logData.recordingUrl = recordingBase64;
    }
  } else if (type === 'message') {
    logData.content = content;
    logData.method = method || 'sms';
  }

  const log = await prisma.contactLog.create({ data: logData });
  sendSuccess(res, log, 201, 'Contact log created');
});
