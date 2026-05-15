import { OcrProvider, OcrResult } from '../interfaces/ocr.interface.js';

export class MockProvider implements OcrProvider {
  readonly name = 'mock';

  async scanImage(imageUrl: string): Promise<OcrResult> {
    // Giả lập thời gian xử lý AI
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Tạo ra một đoạn rawText giả lập dựa trên URL hoặc Random
    return {
      rawText: `
        CUA HANG XANG DAU PETROLIMEX
        SO 123 DUONG ABC
        NGAY: 08/05/2026
        XANG RON 95-III
        DON GIA: 24,500
        SO LUONG: 20.4 L
        TONG CONG: 500,000 VND
        TIEN KHACH DUA: 500,000
        CAM ON QUY KHACH!
      `,
      confidenceScore: 90,
    };
  }
}
