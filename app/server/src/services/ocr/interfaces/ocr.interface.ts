export interface OcrResult {
  rawText: string;
  confidenceScore: number;
}

export interface OcrProvider {
  /**
   * Tên của Provider (ví dụ: 'google_vision', 'mock')
   */
  readonly name: string;

  /**
   * Quét ảnh và trả về toàn bộ text
   */
  scanImage(imageUrl: string): Promise<OcrResult>;
}
