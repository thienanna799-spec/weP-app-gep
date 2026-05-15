/**
 * customerImportColumns — Column mapping for customer Excel import
 */
export const COLUMN_MAP: Record<string, string> = {
  // CUSTOMER CODE
  'customer code': 'code', 'mã kh': 'code', 'ma kh': 'code', 'customer_code': 'code', 'mã khách hàng': 'code',
  // CUSTOMER NAME
  'customer name': 'name', 'customer_name': 'name', 'tên khách hàng': 'name', 'ten khach hang': 'name', 'tên kh': 'name', name: 'name',
  // Phone number
  'phone number': 'phone', phone: 'phone', 'sđt': 'phone', sdt: 'phone', 'số điện thoại': 'phone', 'so dien thoai': 'phone', 'điện thoại': 'phone',
  // ADDRESS
  address: 'address', 'địa chỉ': 'address', 'dia chi': 'address',
  // RECIPIENT'S NAME
  "recipient's name": 'recipientName', 'người nhận': 'recipientName', 'nguoi nhan': 'recipientName',
  // GROUP NAME
  'group name': 'groupName', 'nhóm': 'groupName', nhom: 'groupName',
  // OPERATING PLATFORM
  'operating platform': 'platform', 'nền tảng': 'platform', platform: 'platform',
  // CUSTOMER CHARACTERISTICS
  'customer characteristics': 'characteristics', 'đặc điểm kh': 'characteristics',
  // GIP code
  'gip code (if applicable)': 'gipCode', 'gip code': 'gipCode', gip: 'gipCode',
  // PRODUCT
  product: 'product', 'sản phẩm': 'product', 'san pham': 'product',
  // OPERATIONAL STATUS
  'operational status': 'status', 'trạng thái': 'status', status: 'status',
  // NOTE
  note: 'note', notes: 'note', 'ghi chú': 'note', 'ghi chu': 'note',
  // BOSS
  boss: 'boss', 'người phụ trách': 'boss', 'nguoi phu trach': 'boss',
  // DATE OF ORIGIN
  'date of origin': 'dateOfOrigin', 'ngày tạo': 'dateOfOrigin',
  // Date of cessation
  'date of confirmation of cessation of operations': 'cessationDate', 'date of confirmation of cessation': 'cessationDate',
  // Legacy
  email: 'email', company: 'company', 'công ty': 'company',
  // GOOGLE MAPS
  'google maps': 'googleMapsLink', 'google maps link': 'googleMapsLink', 'gg map': 'googleMapsLink', 'gg maps': 'googleMapsLink', 'maps link': 'googleMapsLink', 'link gg map': 'googleMapsLink',
};

export function getVal(row: Record<string, any>, canonical: string): string {
  for (const [raw, mapped] of Object.entries(COLUMN_MAP)) {
    if (mapped === canonical) {
      if (raw in row) return String(row[raw] || '').trim();
    }
  }
  for (const key of Object.keys(row)) {
    const mapped = COLUMN_MAP[key.toLowerCase().trim()];
    if (mapped === canonical) return String(row[key] || '').trim();
  }
  return '';
}
