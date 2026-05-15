import { ImageAnnotatorClient } from '@google-cloud/vision';
import fetch from 'node-fetch';
import { OcrProvider, OcrResult } from '../interfaces/ocr.interface.js';

export class GoogleVisionProvider implements OcrProvider {
  readonly name = 'google_vision';
  private client: ImageAnnotatorClient;

  constructor() {
    this.client = new ImageAnnotatorClient();
  }

  async scanImage(imageUrl: string): Promise<OcrResult> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const buffer = await response.buffer();

      const [result] = await this.client.textDetection(buffer);
      const detections = result.textAnnotations;
      
      if (detections && detections.length > 0) {
        // Mặc định Google Vision không trả về score tổng thể dễ dàng cho textDetection cơ bản,
        // Nhưng ta có thể tính trung bình confidence của các block nếu gọi documentTextDetection.
        // Ở đây giả lập lấy 95% nếu đọc được thành công.
        return {
          rawText: detections[0].description || '',
          confidenceScore: 95,
        };
      }
      return { rawText: '', confidenceScore: 0 };
    } catch (error: any) {
      console.error('GoogleVision Error:', error.message);
      throw error;
    }
  }
}
