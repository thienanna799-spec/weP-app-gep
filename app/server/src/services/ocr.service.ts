import vision from '@google-cloud/vision';

// Khởi tạo Google Vision Client (Yêu cầu GOOGLE_APPLICATION_CREDENTIALS trong env)
// Nếu chưa có, client vẫn khởi tạo nhưng khi gọi .annotateImage() sẽ throw lỗi.
const client = new vision.ImageAnnotatorClient();

/**
 * Phân tích ảnh hóa đơn/đồng hồ (sử dụng Text Detection của Google Vision)
 * Trả về raw text (Toàn bộ chữ trên ảnh)
 */
async function extractTextFromUrl(imageUrl: string): Promise<string> {
  try {
    // Tải ảnh từ URL về dạng buffer (vì Vision API đôi khi không lấy được từ public URL nếu bị chặn CORS/Auth)
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const [result] = await client.textDetection(buffer);
    const detections = result.textAnnotations;
    if (detections && detections.length > 0) {
      return detections[0].description || ''; // index 0 chứa toàn bộ text ghép lại
    }
    return '';
  } catch (error: any) {
    console.error('OCR Error:', error.message);
    // Fallback: nếu chưa setup Google API Key, trả về rỗng để mock/skip
    return '';
  }
}

/**
 * Trích xuất Số tiền (Amount) từ hóa đơn
 * - Quét các con số trên hóa đơn
 * - Tìm số lớn nhất (thường là Tổng tiền)
 */
export async function scanReceiptAmount(imageUrl: string): Promise<{ amount: number | null; text: string }> {
  const text = await extractTextFromUrl(imageUrl);
  if (!text) return { amount: null, text: '' };

  // Logic đơn giản: Tìm tất cả các con số có dạng tiền tệ (vd: 50.000, 100,000, 500000)
  const numberRegex = /[\d.,]+/g;
  const matches = text.match(numberRegex);
  
  if (!matches) return { amount: null, text };

  let maxAmount = 0;
  for (const match of matches) {
    // Loại bỏ dấu phẩy/chấm để lấy số nguyên
    const cleanStr = match.replace(/[,.]/g, '');
    const num = parseInt(cleanStr, 10);
    // Chỉ lấy những số khả thi (ví dụ tiền xăng từ 10.000 đến 5.000.000)
    if (!isNaN(num) && num >= 10000 && num <= 5000000) {
      if (num > maxAmount) {
        maxAmount = num;
      }
    }
  }

  return { 
    amount: maxAmount > 0 ? maxAmount : null,
    text 
  };
}

/**
 * Trích xuất Số KM (Odometer) từ ảnh bảng đồng hồ
 */
export async function scanOdometer(imageUrl: string): Promise<{ mileage: number | null; text: string }> {
  const text = await extractTextFromUrl(imageUrl);
  if (!text) return { mileage: null, text: '' };

  // Logic tìm số KM: thường là số nguyên 4-6 chữ số (ví dụ: 125000)
  const numberRegex = /\d{4,6}/g;
  const matches = text.match(numberRegex);
  
  if (!matches) return { mileage: null, text };

  // Lấy số lớn nhất (hoặc logic phù hợp với đồng hồ xe)
  let maxMileage = 0;
  for (const match of matches) {
    const num = parseInt(match, 10);
    if (!isNaN(num) && num > maxMileage) {
      maxMileage = num;
    }
  }

  return {
    mileage: maxMileage > 0 ? maxMileage : null,
    text
  };
}
