import { prisma } from '../../../lib/prisma.js';

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  fraudReason: string | null;
  isMatched: boolean;
}

export class FraudService {
  /**
   * Đánh giá rủi ro dựa trên độ lệch và độ tin cậy
   */
  static calculateRisk(difference: number, confidence: number): RiskAssessment {
    const diffAbs = Math.abs(difference);

    if (diffAbs > 50000) {
      return { riskLevel: 'high', fraudReason: 'amount_mismatch', isMatched: false };
    }
    if (diffAbs > 5000) {
      return { riskLevel: 'medium', fraudReason: 'amount_mismatch', isMatched: false };
    }
    
    // Nếu độ lệch rất nhỏ (làm tròn) nhưng OCR không tự tin
    if (confidence < 70) {
      return { riskLevel: 'medium', fraudReason: 'low_confidence', isMatched: true };
    }

    return { riskLevel: 'low', fraudReason: null, isMatched: true };
  }

  /**
   * Kiểm tra ảnh trùng lặp dựa trên hash
   * Trả về ID của Audit Log nếu trùng, hoặc null nếu an toàn
   */
  static async detectDuplicate(imageHash: string): Promise<string | null> {
    if (!imageHash) return null;

    const existing = await prisma.ocrAuditLog.findFirst({
      where: { imageHash },
      select: { id: true }
    });

    return existing ? existing.id : null;
  }
}
