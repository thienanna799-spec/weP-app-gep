import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export class InventoryExportService {
  /**
   * Generates an Excel file buffer containing inventory (ProductRoll) data.
   */
  async generateStockExcel(): Promise<Buffer> {
    // 1. Fetch data from DB
    // Only fetch rolls that are currently in stock (trong_kho)
    const rolls = await prisma.productRoll.findMany({
      where: {
        status: 'trong_kho',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Initialize Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GEP ERP System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Inventory Report');

    // 3. Define Columns
    worksheet.columns = [
      { header: 'Mã Cuộn (Roll Code)', key: 'code', width: 20 },
      { header: 'Sản Phẩm (Product Name)', key: 'productName', width: 30 },
      { header: 'SKU / Mã KH', key: 'sku', width: 25 },
      { header: 'Mã Nội Bộ (Sub-SKU)', key: 'subSku', width: 25 },
      { header: 'Quy Cách (Specification)', key: 'specification', width: 20 },
      { header: 'Số Lượng', key: 'stockQuantity', width: 15 },
      { header: 'Chiều Dài (m)', key: 'length', width: 15 },
      { header: 'Khối Lượng (kg)', key: 'weight', width: 15 },
      { header: 'Kho (Warehouse)', key: 'positionWarehouse', width: 15 },
      { header: 'Khu Vực (Area)', key: 'positionArea', width: 15 },
      { header: 'Ngày Sản Xuất', key: 'productionDate', width: 20 },
    ];

    // 4. Style Header Row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' } // Blue header
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 5. Add Data Rows
    rolls.forEach((roll) => {
      worksheet.addRow({
        code: roll.code,
        productName: roll.productName,
        sku: roll.sku || 'N/A',
        subSku: roll.subSku || 'N/A',
        specification: roll.specification,
        stockQuantity: roll.stockQuantity,
        length: roll.length,
        weight: roll.weight,
        positionWarehouse: roll.positionWarehouse || 'Chưa định vị',
        positionArea: roll.positionArea || 'N/A',
        productionDate: roll.productionDate ? new Date(roll.productionDate).toLocaleDateString('vi-VN') : 'N/A',
      });
    });

    // 6. Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }
}

export const inventoryExportService = new InventoryExportService();
