import { prisma } from '../lib/prisma.js';

// ── CUSTOMERS EXCEL SERVICE ──────────────────────────────────────────────

export class CustomerExcelService {
  static async generateTemplate(): Promise<any> {
    const XLSX = await import('xlsx');
    const templateData = [
      {
        'DATE OF ORIGIN': '15/01/2025', 'CUSTOMER CODE': 'KH-0001', 'CUSTOMER NAME': 'Công ty ABC',
        "RECIPIENT'S NAME": 'Nguyễn Văn A', 'Phone number': '0901234567', 'ADDRESS': '123 Nguyễn Huệ, Q1, TP.HCM',
        'GROUP NAME': 'Đại lý cấp 1', 'OPERATING PLATFORM': 'Shopee', 'CUSTOMER CHARACTERISTICS': 'Khách hàng VIP, mua sỉ',
        'GIP code (if applicable)': 'GIP-001', 'PRODUCT': 'Băng dính đen', 'OPERATIONAL STATUS': 'active',
        'NOTE': 'Thanh toán đúng hạn', 'BOSS': 'Trần B', 'Date of confirmation of cessation of operations': '',
      },
      {
        'DATE OF ORIGIN': '20/03/2025', 'CUSTOMER CODE': 'KH-0002', 'CUSTOMER NAME': 'Trần Thị B',
        "RECIPIENT'S NAME": 'Trần Thị B', 'Phone number': '0987654321', 'ADDRESS': '456 Lê Lợi, Q3, TP.HCM',
        'GROUP NAME': 'Khách lẻ', 'OPERATING PLATFORM': 'Facebook', 'CUSTOMER CHARACTERISTICS': 'Khách mới, tiềm năng',
        'GIP code (if applicable)': '', 'PRODUCT': 'Màng co PE', 'OPERATIONAL STATUS': 'active',
        'NOTE': '', 'BOSS': 'Nguyễn C', 'Date of confirmation of cessation of operations': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 20 },
      { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Template');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  static async processImport(fileBase64: string, userId: string, userEmail: string): Promise<any> {
    const XLSX = await import('xlsx');
    let workbook;
    try {
      const buffer = Buffer.from(fileBase64, 'base64');
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new Error('Invalid file format. Please upload .xlsx or .csv');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Empty file — no sheets found');

    const sheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) throw new Error('Empty file — no data rows');
    if (rawRows.length > 2000) throw new Error(`Max 2000 rows per upload. File has ${rawRows.length} rows.`);

    const rawHeaders = Object.keys(rawRows[0]);
    const headerMap = this.normalizeCustomerHeaders(rawHeaders);
    const mappedCols = Object.values(headerMap);

    if (!mappedCols.includes('name') && !mappedCols.includes('code')) {
      throw new Error('Missing required column: CUSTOMER NAME or CUSTOMER CODE. Please download the template.');
    }

    const getVal = (row: Record<string, any>, canonical: string): string => {
      for (const [raw, mapped] of Object.entries(headerMap)) {
        if (mapped === canonical) return String(row[raw] || '').trim();
      }
      return '';
    };
    const getRaw = (row: Record<string, any>, canonical: string): any => {
      for (const [raw, mapped] of Object.entries(headerMap)) {
        if (mapped === canonical) return row[raw];
      }
      return '';
    };

    const errors: { row: number; message: string }[] = [];
    const validRows: any[] = [];
    const seenCodes = new Set<string>();

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const name = getVal(row, 'name');
      const code = getVal(row, 'code');
      const rawPhone = getVal(row, 'phone');
      
      if (!name && !code && !rawPhone) return;

      // Cho phép mã rỗng để tự động sinh
      if (code) {
        if (seenCodes.has(code.toUpperCase())) { errors.push({ row: rowNum, message: `Duplicate CUSTOMER CODE trong file: ${code}` }); return; }
        seenCodes.add(code.toUpperCase());
      }

      validRows.push({
        rowNum, code, name: name || code, phone: rawPhone ? this.normalizePhone(rawPhone) : '',
        email: getVal(row, 'email'), address: getVal(row, 'address'), dateOfOrigin: this.parseDate(getRaw(row, 'dateOfOrigin')),
        recipientName: getVal(row, 'recipientName'), groupName: getVal(row, 'groupName'), operatingPlatform: getVal(row, 'operatingPlatform'),
        customerCharacteristics: getVal(row, 'customerCharacteristics'), gipCode: getVal(row, 'gipCode'), product: getVal(row, 'product'),
        operationalStatus: this.resolveStatus(getVal(row, 'operationalStatus') || 'active'), boss: getVal(row, 'boss'),
        cessationDate: this.parseDate(getRaw(row, 'cessationDate')), notes: getVal(row, 'notes'), province: getVal(row, 'province'),
        district: getVal(row, 'district'), company: getVal(row, 'company'), customerType: getVal(row, 'customerType'),
        taxCode: getVal(row, 'taxCode'), contactPerson: getVal(row, 'contactPerson'),
      });
    });

    if (validRows.length === 0) {
      return { summary: { totalRows: rawRows.length, created: 0, updated: 0, failed: errors.length }, errors };
    }

    let created = 0; let updated = 0;
    
    // Tìm mã CUS cao nhất hiện có
    const latestCustomer = await prisma.customer.findFirst({
      where: { code: { startsWith: 'CUS' } },
      orderBy: { code: 'desc' },
    });
    let nextNum = 1;
    if (latestCustomer && latestCustomer.code) {
      const match = latestCustomer.code.match(/CUS(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        let currentCode = row.code;
        if (!currentCode) {
          currentCode = `CUS${String(nextNum).padStart(5, '0')}`;
          nextNum++;
        }

        const existing = await tx.customer.findFirst({ where: { code: currentCode } });
        const dataFields: any = {
          name: row.name, ...(row.phone && { phone: row.phone }), ...(row.email && { email: row.email }),
          ...(row.address && { address: row.address }), ...(row.dateOfOrigin && { dateOfOrigin: row.dateOfOrigin }),
          ...(row.recipientName && { recipientName: row.recipientName }), ...(row.groupName && { groupName: row.groupName }),
          ...(row.operatingPlatform && { operatingPlatform: row.operatingPlatform }), ...(row.customerCharacteristics && { customerCharacteristics: row.customerCharacteristics }),
          ...(row.gipCode && { gipCode: row.gipCode }), ...(row.product && { product: row.product }),
          operationalStatus: row.operationalStatus, ...(row.boss && { boss: row.boss }), ...(row.cessationDate && { cessationDate: row.cessationDate }),
          ...(row.notes && { notes: row.notes }), ...(row.province && { province: row.province }), ...(row.district && { district: row.district }),
          ...(row.company && { company: row.company }), ...(row.taxCode && { taxCode: row.taxCode }), ...(row.contactPerson && { contactPerson: row.contactPerson }),
          isActive: row.operationalStatus !== 'stopped',
        };

        if (existing) {
          await tx.customer.update({ where: { id: existing.id }, data: dataFields });
          updated++;
        } else {
          await tx.customer.create({ data: { code: currentCode, phone: row.phone || '', address: row.address || '', ...dataFields } });
          created++;
        }
      }
    });

    await prisma.userActivityLog.create({
      data: { userId, email: userEmail, action: 'Import customers (Excel v2)', module: 'Khách hàng', description: `Imported ${created} new, updated ${updated} existing customers from Excel (CRM v2)` },
    });

    return { summary: { totalRows: rawRows.length, created, updated, failed: errors.length }, errors };
  }

  private static normalizeCustomerHeaders(rawHeaders: string[]): Record<string, string> {
    const COLUMN_MAP: Record<string, string> = {
      'date of origin': 'dateOfOrigin', 'ngày tạo': 'dateOfOrigin', 'customer code': 'code', 'mã kh': 'code', 'ma kh': 'code', 'mã khách hàng': 'code',
      'customer name': 'name', 'tên khách hàng': 'name', 'ten khach hang': 'name', 'tên kh': 'name', 'customer_name': 'name', 'name': 'name',
      "recipient's name": 'recipientName', 'người nhận': 'recipientName', 'nguoi nhan': 'recipientName', 'phone number': 'phone', 'phone': 'phone', 'sđt': 'phone', 'sdt': 'phone', 'số điện thoại': 'phone', 'so dien thoai': 'phone', 'điện thoại': 'phone',
      'address': 'address', 'địa chỉ': 'address', 'dia chi': 'address', 'group name': 'groupName', 'nhóm': 'groupName', 'nhom': 'groupName',
      'operating platform': 'operatingPlatform', 'nền tảng': 'operatingPlatform', 'nen tang': 'operatingPlatform', 'platform': 'operatingPlatform',
      'customer characteristics': 'customerCharacteristics', 'đặc điểm kh': 'customerCharacteristics', 'dac diem kh': 'customerCharacteristics',
      'gip code (if applicable)': 'gipCode', 'gip code': 'gipCode', 'gip': 'gipCode', 'product': 'product', 'sản phẩm': 'product', 'san pham': 'product',
      'operational status': 'operationalStatus', 'trạng thái': 'operationalStatus', 'trang thai': 'operationalStatus', 'status': 'operationalStatus',
      'note': 'notes', 'notes': 'notes', 'ghi chú': 'notes', 'ghi chu': 'notes', 'boss': 'boss', 'người phụ trách': 'boss', 'nguoi phu trach': 'boss', 'phụ trách': 'boss',
      'date of confirmation of cessation of operations': 'cessationDate', 'date of confirmation of cessation': 'cessationDate', 'ngày ngừng hoạt động': 'cessationDate',
      'email': 'email', 'company': 'company', 'công ty': 'company', 'province': 'province', 'tỉnh': 'province', 'district': 'district', 'quận/huyện': 'district', 'customer_type': 'customerType', 'loại kh': 'customerType', 'tax_code': 'taxCode', 'mã số thuế': 'taxCode', 'contact_person': 'contactPerson', 'người liên hệ': 'contactPerson',
    };
    const map: Record<string, string> = {};
    rawHeaders.forEach((h) => {
      const key = h.trim().toLowerCase();
      const canonical = COLUMN_MAP[key];
      if (canonical) map[h] = canonical;
    });
    return map;
  }

  private static normalizePhone(phone: string): string {
    let p = phone.replace(/[\s\-\.\(\)]/g, '');
    if (p.startsWith('+84')) p = '0' + p.slice(3);
    if (p.startsWith('84') && p.length > 9) p = '0' + p.slice(2);
    return p;
  }

  private static parseDate(val: any): Date | null {
    if (!val) return null;
    if (typeof val === 'number') {
      const d = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    const s = String(val).trim();
    if (!s) return null;
    const ddmm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmm) {
      const d = new Date(Number(ddmm[3]), Number(ddmm[2]) - 1, Number(ddmm[1]));
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  private static resolveStatus(val: string): string {
    const s = val.toLowerCase().trim();
    if (['active', 'hoạt động', 'hoat dong'].includes(s)) return 'active';
    if (['inactive', 'không hoạt động', 'khong hoat dong', 'tạm dừng'].includes(s)) return 'inactive';
    if (['stopped', 'ngừng', 'ngung', 'đã ngừng'].includes(s)) return 'stopped';
    return 'active';
  }
}

// ── BATCH IMPORT EXCEL SERVICE ──────────────────────────────────────────────

export class ImportBatchExcelService {
  static async generateTemplate(): Promise<any> {
    const XLSX = await import('xlsx');
    const templateData = [
      { 'STT': 1, 'SKU': 'BWP-TH-BLACK-4inch', 'XƯỞNG': 'TT', 'TÊN SP': 'BWP', 'SUB-SKU': 'TT-BWP-BLACK-Half', 'MÀU SẮC': 'BLACK', 'QUY CÁCH': 'Halfx60', 'SỐ LƯỢNG': 10, 'THÔNG SỐ KHÁC': '3,3', 'GIÁ VỐN': 320, 'Ghi chú': '23/03/2026', 'NOTE': 'Half' },
      { 'STT': 2, 'SKU': 'BWP-TK-WHITE-4inch', 'XƯỞNG': 'PP', 'TÊN SP': 'BWP', 'SUB-SKU': 'PP-BWP-WHITE-Full', 'MÀU SẮC': 'WHITE', 'QUY CÁCH': 'Fullx70', 'SỐ LƯỢNG': 5, 'THÔNG SỐ KHÁC': '3,7', 'GIÁ VỐN': 350, 'Ghi chú': '', 'NOTE': 'Whole' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Template');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  static async processImport(fileBase64: string, userId: string, userEmail: string, quickImport: boolean = false): Promise<any> {
    const XLSX = await import('xlsx');
    let workbook;
    try {
      const buffer = Buffer.from(fileBase64, 'base64');
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch {
      throw new Error('File không hợp lệ. Vui lòng upload file .xlsx');
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('File Excel trống — không có sheet nào');
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

    if (rows.length === 0) throw new Error('File Excel trống — không có dữ liệu');
    if (rows.length > 1000) throw new Error(`Tối đa 1000 dòng mỗi lần upload. File có ${rows.length} dòng.`);

    const firstRow = rows[0];
    if (!('product_name' in firstRow) && !('TÊN SP' in firstRow)) {
      throw new Error(`Thiếu cột bắt buộc: TÊN SP (hoặc product_name). Vui lòng tải template mẫu.`);
    }

    const errors: { row: number; message: string }[] = [];
    const validRows: any[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const productName = String(row['TÊN SP'] || row.product_name || '').trim();
      if (!productName) { errors.push({ row: rowNum, message: 'Thiếu tên sản phẩm (TÊN SP)' }); return; }

      const costPriceRaw = row['GIÁ VỐN'] ?? row.costPrice ?? null;
      const costPrice = costPriceRaw !== null && costPriceRaw !== '' ? Number(costPriceRaw) : null;
      
      const qtyRaw = row['SỐ LƯỢNG'] ?? row.quantity ?? 0;
      const parsedQty = parseInt(qtyRaw, 10);
      const quantity = isNaN(parsedQty) || parsedQty < 0 ? 0 : parsedQty;
      
      const formatNoteVal = (v: any) => {
        if (!v && v !== 0) return '';
        const s = String(v).trim();
        const n = Number(s);
        if (!isNaN(n) && n >= 40000 && n <= 60000 && Number.isInteger(n)) {
          return new Date((n - 25569) * 86400 * 1000).toLocaleDateString('vi-VN');
        }
        return s;
      };

      const notes = [
        formatNoteVal(row['Ghi chú']), formatNoteVal(row['NOTE']),
        row['THÔNG SỐ KHÁC'] ? `Thông số khác: ${row['THÔNG SỐ KHÁC']}` : '', formatNoteVal(row.note)
      ].filter(Boolean).join(' | ');

      validRows.push({
        rowNum, productName, sku: String(row['SKU'] || row.sku || '').trim(), subSku: String(row['SUB-SKU'] || row.sub_sku || '').trim(),
        specification: String(row['QUY CÁCH'] || row.specification || '').trim(), color: String(row['MÀU SẮC'] || row.color || '').trim(),
        otherSpecs: String(row['THÔNG SỐ KHÁC'] || row.otherSpecs || '').trim(), costPrice: costPrice !== null && !isNaN(costPrice) ? costPrice : null,
        quantity, supplier: String(row['XƯỞNG'] || row.supplier || '').trim(), note: notes,
      });
    });

    if (validRows.length === 0) return { batchIds: [], summary: { totalRows: rows.length, success: 0, failed: errors.length }, errors };

    const batchIds: string[] = [];
    let totalRollsCreated = 0;
    
    const rollStatus = quickImport ? 'trong_kho' : 'dang_san_xuat';
    const scanAction = quickImport ? 'Nhập kho nhanh (Quick Import)' : 'Khởi tạo cuộn — Nhập hàng ngoài';
    const crypto = await import('crypto');

    await prisma.$transaction(async (tx) => {
      for (const b of validRows) {
        const batch = await tx.importBatch.create({
          data: {
            productName: b.productName,
            sku: b.sku || null,
            subSku: b.subSku || null,
            specification: b.specification || null,
            color: b.c