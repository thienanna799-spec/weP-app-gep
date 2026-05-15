import { Response, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { scanReceiptAmount, scanOdometer } from '../services/ocr.service.js';

/**
 * Webhook để chạy OCR kiểm toán ngầm.
 * Được gọi từ App (hoặc nội bộ Server) sau khi upload hóa đơn/ảnh công tơ mét.
 * 
 * POST /api/webhooks/ocr/audit
 * Body: {
 *   driverId: string;
 *   vehicleId?: string;
 *   referenceId: string; // ID của FuelLog, DailyLog, hoặc Maintenance
 *   documentType: 'fuel_receipt' | 'repair_receipt' | 'odometer';
 *   imageUrl: string;
 *   declaredValue: number; // Số tiền / số KM do tài xế khai báo
 * }
 */
export const runOcrAudit = asyncHandler(async (req: Request, res: Response) => {
  const { driverId, vehicleId, referenceId, documentType, imageUrl, declaredValue } = req.body;

  if (!driverId || !referenceId || !documentType || !imageUrl || declaredValue === undefined) {
    sendError(res, 'Missing required fields', 400);
    return;
  }

  // Trả về response ngay để không block tiến trình (Chạy ngầm)
  sendSuccess(res, { message: 'OCR Audit started in background' }, 202);

  try {
    let extractedValue: number | null = null;
    let confidenceScore = 80; // Giả lập độ tin cậy mặc định, Vision API trả về detail phức tạp hơn

    if (documentType === 'fuel_receipt' || documentType === 'repair_receipt') {
      const result = await scanReceiptAmount(imageUrl);
      extractedValue = result.amount;
    } else if (documentType === 'odometer') {
      const result = await scanOdometer(imageUrl);
      extractedValue = result.mileage;
    }

    let isMatched = true;
    
    // So sánh với dung sai (ví dụ: tiền lệch dưới 1000đ thì bỏ qua, KM lệch < 10 thì bỏ qua)
    if (extractedValue !== null) {
      if (documentType === 'odometer') {
         isMatched = Math.abs(extractedValue - declaredValue) <= 5; // Dung sai 5 KM
      } else {
         isMatched = Math.abs(extractedValue - declaredValue) <= 1000; // Dung sai 1000 VNĐ
      }
    } else {
      // OCR không đọc được -> Báo lệch (cần con người check)
      isMatched = false;
    }

    const diffVal = extractedValue !== null ? extractedValue - declaredValue : null;
    const auditLog = await prisma.ocrAuditLog.create({
      data: {
        driverId,
        vehicleId,
        referenceId,
        documentType,
        imageUrl,
        declaredValue,
        extractedValue,
        differenceValue: diffVal,
        confidenceScore,
        riskLevel: isMatched ? 'low' : 'high',
        fraudReason: isMatched ? null : 'amount_mismatch',
        pipelineStatus: 'audited',
        reviewStatus: isMatched ? 'approved' : 'pending',
      }
    });

    // Nếu KHÔNG khớp -> Bắn cảnh báo đỏ cho Admin
    if (!isMatched) {
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      const drvName = driver ? driver.name : 'Tài xế';
      
      const typeLabel = documentType === 'fuel_receipt' ? 'Hóa đơn đổ xăng' 
                      : documentType === 'odometer' ? 'Số KM đồng hồ' 
                      : 'Hóa đơn sửa chữa';

      const extValLabel = extractedValue !== null ? extractedValue.toLocaleString('vi-VN') : 'Không đọc được';
      
      const alertMsg = `⚠️ CẢNH BÁO OCR: ${drvName} khai báo ${typeLabel} là ${declaredValue.toLocaleString('vi-VN')} nhưng hệ thống đọc ra ${extValLabel}. (Ref: ${referenceId})`;

      // Lưu vào NotificationLog để hiển thị trên web
      await prisma.notificationLog.create({
        data: {
          recipient: 'admin',
          type: 'ocr_alert',
          subject: 'Cảnh báo gian lận / Sai sót nhập liệu',
          content: alertMsg,
          status: 'sent',
        }
      });

      // Phát event qua Socket (nếu cần hiển thị toast ngay trên web)
      // Tùy chọn: io.emit('ocr_alert', alertMsg)
    }

  } catch (error) {
    console.error('Lỗi chạy OCR ngầm:', error);
  }
});
