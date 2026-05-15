import { ProductRoll } from '../types';
import { formatDate } from '../../../utils/format';

export const exportInventoryToExcel = async (
  filteredRolls: ProductRoll[],
  t: any,
  setExporting: (val: boolean) => void,
  setToastMessage: (val: string | null) => void
) => {
  if (filteredRolls.length === 0) {
    alert("Không có dữ liệu để xuất");
    return;
  }
  
  setExporting(true);
  try {
    const XLSX = await import('xlsx');
    
    const exportData = filteredRolls.map((roll, index) => ({
      'STT': index + 1,
      'SKU': roll.productName, // Hoặc ghép thêm thuộc tính nếu cần
      'XƯỞNG': roll.positionWarehouse || roll.supplier || '',
      'TÊN SP': roll.productName,
      'SUB-SKU': roll.code || roll.qrCode,
      'MÀU SẮC': '', // Không có trường màu sắc trong DB hiện tại
      'QUY CÁCH': roll.specification || '',
      'THÔNG SỐ KHÁC': roll.weight ? roll.weight.toString() : '',
      'GIÁ VỐN': '', // Không có giá vốn
      'Ghi chú': roll.productionDate ? formatDate(roll.productionDate) : '',
      'NOTE': t(`status.${roll.status}`) // Tạm dùng status cho Note hoặc để trống
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    const colWidths = [
      { wch: 5 },  // STT
      { wch: 30 }, // SKU
      { wch: 10 }, // XƯỞNG
      { wch: 15 }, // TÊN SP
      { wch: 30 }, // SUB-SKU
      { wch: 15 }, // MÀU SẮC
      { wch: 20 }, // QUY CÁCH
      { wch: 20 }, // THÔNG SỐ KHÁC
      { wch: 15 }, // GIÁ VỐN
      { wch: 20 }, // Ghi chú
      { wch: 20 }  // NOTE
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `inventory_report_${dateStr}.xlsx`);
    
    setToastMessage("Xuất file thành công!");
    setTimeout(() => setToastMessage(null), 3000);
  } catch (error) {
    console.error("Export error:", error);
    alert("Lỗi khi xuất file");
  } finally {
    setExporting(false);
  }
};
