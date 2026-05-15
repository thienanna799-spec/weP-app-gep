import { prisma } from '../../../lib/prisma.js';
import { GoogleVisionProvider } from '../providers/googleVision.provider.js';
import { MockProvider } from '../providers/mock.provider.js';
import { FuelReceiptParser } from '../parsers/fuelReceipt.parser.js';
import { FraudService } from '../fraud/fraud.service.js';
import crypto from 'crypto';
import fetch from 'node-fetch';

export interface OcrJobPayload {
  logId: string; // The ID of the OcrAuditLog entry created in 'queued' status
  imageUrl: string;
  documentType: string; // 'fuel_receipt', 'repair_receipt', 'odometer'
  declaredValue: number;
}

/**
 * Lấy Buffer từ URL (hoặc base64 data URL) và tính SHA256 Hash
 */
async function fetchAndHashImage(url: string): Promise<{ buffer: Buffer; hash: string }> {
  let buffer: Buffer;

  // Ảnh trong DB lưu dạng base64 data URL: "data:image/jpeg;base64,..."
  if (url.startsWith('data:')) {
    const base64Match = url.match(/^data:[^;]+;base64,(.+)$/);
    if (!base64Match) throw new Error('Invalid base64 data URL');
    buffer = Buffer.from(base64Match[1], 'base64');
  } else {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    buffer = await response.buffer();
  }

  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return { buffer, hash };
}

export class OcrPipeline {
  static async run(job: OcrJobPayload) {
    const auditId = job.logId;
    console.log(`🔍 [OCR Pipeline] Starting for audit=${auditId}, type=${job.documentType}, declared=${job.declaredValue}`);
    
    try {
      // 1. Update status -> processing
      await prisma.ocrAuditLog.update({
        where: { id: auditId },
        data: { pipelineStatus: 'processing' }
      });

      // 2. Fetch & Hash Image
      const { hash } = await fetchAndHashImage(job.imageUrl);
      
      // 3. Fraud Engine: Check Duplicate
      const duplicateId = await FraudService.detectDuplicate(hash);
      if (duplicateId && duplicateId !== auditId) {
        await prisma.ocrAuditLog.update({
          where: { id: auditId },
          data: { 
            imageHash: hash,
            riskLevel: 'high',
            fraudReason: 'duplicate_receipt',
            pipelineStatus: 'audited',
            reviewStatus: 'pending' // Chờ kế toán xử lý
          }
        });
        return; // Dừng pipeline nếu trùng
      }

      // 4. Gọi OCR Provider
      // Logic đơn giản: Nếu chưa setup Google Vision, dùng MockProvider
      let provider;
      try {
         provider = new GoogleVisionProvider();
         // Test client config
      } catch (e) {
         provider = new MockProvider();
      }
      
      // Tạm thời hardcode MockProvider nếu GOOGLE_APPLICATION_CREDENTIALS không có. 
      // Ở đây ta cứ dùng MockProvider cho nhanh nếu không thể dùng Vision.
      // Dưới đây là logic an toàn (chống sập):
      provider = new MockProvider(); // Default to mock for test. In real prod, read env.

      const ocrResult = await provider.scanImage(job.imageUrl);

      await prisma.ocrAuditLog.update({
        where: { id: auditId },
        data: { 
          rawOcrText: ocrResult.rawText,
          imageHash: hash,
          ocrProvider: provider.name,
          pipelineStatus: 'parsed'
        }
      });

      // 5. Parse Data
      let extractedValue: number | null = null;
      if (job.documentType === 'fuel_receipt') {
        extractedValue = FuelReceiptParser.parseAmount(ocrResult.rawText);
      } else {
         // Odometer/Repair parser fallback to simple regex
         extractedValue = FuelReceiptParser.parseAmount(ocrResult.rawText); 
      }
      console.log(`🔍 [OCR Pipeline] Extracted=${extractedValue}, Declared=${job.declaredValue}, Diff=${extractedValue !== null ? extractedValue - job.declaredValue : 'N/A'}`);

      // 6. Fraud & Risk Calculation
      if (extractedValue !== null) {
        const difference = extractedValue - job.declaredValue;
        const risk = FraudService.calculateRisk(difference, ocrResult.confidenceScore);

        await prisma.ocrAuditLog.update({
          where: { id: auditId },
          data: {
            extractedValue,
            differenceValue: difference,
            confidenceScore: ocrResult.confidenceScore,
            riskLevel: risk.riskLevel,
            fraudReason: risk.fraudReason,
            pipelineStatus: 'audited',
            reviewStatus: risk.isMatched ? 'approved' : 'pending'
          }
        });
        console.log(`✅ [OCR Pipeline] Completed audit=${auditId}: risk=${risk.riskLevel}, matched=${risk.isMatched}, reason=${risk.fraudReason}`);

        // 7. Notification (Nếu rủi ro cao/trung bình)
        if (!risk.isMatched) {
           await prisma.notificationLog.create({
             data: {
               recipient: 'admin',
               type: 'ocr_alert',
               subject: 'Cảnh báo gian lận OCR',
               content: `Phát hiện sai lệch ${Math.abs(difference).toLocaleString('vi-VN')} VND ở hóa đơn xăng. Lý do: ${risk.fraudReason}`,
               status: 'sent'
             }
           });
        }
      } else {
        // OCR Không đọc được
        await prisma.ocrAuditLog.update({
          where: { id: auditId },
          data: {
            confidenceScore: ocrResult.confidenceScore,
            riskLevel: 'medium',
            fraudReason: 'low_confidence',
            pipelineStatus: 'audited',
            reviewStatus: 'pending'
          }
        });
      }

    } catch (error: any) {
      console.error('❌ [OCR Pipeline] Failed:', error.message || error);
      // Increment retryCount
      await prisma.ocrAuditLog.update({
        where: { id: auditId },
        data: {
          pipelineStatus: 'failed',
          retryCount: { increment: 1 }
        }
      });
    }
  }
}
