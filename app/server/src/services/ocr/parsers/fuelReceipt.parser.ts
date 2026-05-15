export class FuelReceiptParser {
  /**
   * Score-based parser
   * Quét từng dòng của raw text, tìm các keyword và gán điểm (score).
   * Lấy số liệu nằm trên dòng có tổng điểm cao nhất.
   */
  static parseAmount(rawText: string): number | null {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    let bestCandidate: { amount: number; score: number } | null = null;

    for (const line of lines) {
      const upperLine = line.toUpperCase();
      let score = 0;

      // Positive keywords
      if (upperLine.includes('TONG CONG') || upperLine.includes('TỔNG CỘNG')) score += 100;
      if (upperLine.includes('THANH TOAN') || upperLine.includes('THANH TOÁN')) score += 90;
      if (upperLine.includes('TONG TIEN') || upperLine.includes('TỔNG TIỀN')) score += 90;
      if (upperLine.includes('VND') || upperLine.includes('VNĐ')) score += 30;

      // Negative keywords (Tránh bắt nhầm tiền khách đưa hoặc tiền thừa)
      if (upperLine.includes('KHACH DUA') || upperLine.includes('KHÁCH ĐƯA')) score -= 100;
      if (upperLine.includes('TRA LAI') || upperLine.includes('TRẢ LẠI')) score -= 100;
      if (upperLine.includes('TIEN THUA') || upperLine.includes('TIỀN THỪA')) score -= 100;

      // Nếu dòng có score dương và có chứa số tiền
      if (score > 0) {
        // Tìm số tiền trên dòng này (loại bỏ dấu phẩy/chấm)
        const match = upperLine.match(/[\d.,]+/g);
        if (match) {
          // Lấy con số lớn nhất trên dòng đó làm amount
          for (const m of match) {
            const cleanStr = m.replace(/[,.]/g, '');
            const num = parseInt(cleanStr, 10);
            
            // Lọc các số hợp lý (ví dụ tiền xăng > 10,000)
            if (!isNaN(num) && num >= 10000 && num <= 5000000) {
              if (!bestCandidate || score > bestCandidate.score) {
                bestCandidate = { amount: num, score };
              } else if (score === bestCandidate.score && num > bestCandidate.amount) {
                // Ưu tiên số lớn hơn nếu bằng điểm
                bestCandidate = { amount: num, score };
              }
            }
          }
        }
      }
    }

    // Nếu không tìm thấy bằng keyword, fallback sang số lớn nhất toàn bộ
    if (!bestCandidate) {
       return this.fallbackParseAmount(rawText);
    }

    return bestCandidate.amount;
  }

  private static fallbackParseAmount(rawText: string): number | null {
     const match = rawText.match(/[\d.,]+/g);
     if (!match) return null;
     
     let max = 0;
     for (const m of match) {
        const cleanStr = m.replace(/[,.]/g, '');
        const num = parseInt(cleanStr, 10);
        if (!isNaN(num) && num >= 10000 && num <= 5000000 && num > max) {
            max = num;
        }
     }
     return max > 0 ? max : null;
  }
}
