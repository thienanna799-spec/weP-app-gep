import { utils, writeFile } from 'xlsx';
import { inventoryService } from '../services/inventory.service';
import { ProductRoll } from '../types';

export const exportModalToExcel = (selectedRow: any, filteredRolls: ProductRoll[]) => {
  if (!selectedRow || filteredRolls.length === 0) return;

  const dataToExport = filteredRolls.map((roll, index) => ({
    'STT': index + 1,
    'Sản phẩm': roll.productName || selectedRow.productName,
    'Quy cách': roll.specification || selectedRow.specification,
    'Mã cuộn': roll.code,
    'Mã QR': roll.qrCode,
    'Kho': roll.positionWarehouse || '',
    'Khu vực': roll.positionArea || '',
    'Vị trí': roll.positionSlot || '',
    'Chiều dài (m)': roll.length,
    'Cân nặng (kg)': roll.weight,
    'Ngày sản xuất': roll.productionDate ? new Date(roll.productionDate).toLocaleDateString('vi-VN') : '',
    'Trạng thái': roll.status,
  }));

  const worksheet = utils.json_to_sheet(dataToExport);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Danh_sach_cuon');
  
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }
  ];

  const safeSku = (selectedRow.subSku || 'Unknown').replace(/[^a-zA-Z0-9-]/g, '_');
  writeFile(workbook, `ChiTietCuon_${safeSku}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const handleExportSelected = async (
  selectedSkus: Set<string>,
  exportStartDate: string,
  exportEndDate: string,
  setExportingExcel: (v: boolean) => void
) => {
  if (selectedSkus.size === 0) return;
  setExportingExcel(true);
  try {
    const subSkusToFetch = Array.from<string>(selectedSkus).map((key: string) => key.split('|')[0]).filter(Boolean);
    const uniqueSubSkus = [...new Set(subSkusToFetch)];
    
    if (uniqueSubSkus.length === 0) {
      alert('Các mã đã chọn không có Sub-SKU hợp lệ để xuất.');
      return;
    }

    const allLogs = await Promise.all(
      uniqueSubSkus.map(sku => inventoryService.getHistory(sku).catch(() => []))
    );
    
    let flatLogs = allLogs.flat();

    if (exportStartDate) {
      const start = new Date(exportStartDate).getTime();
      flatLogs = flatLogs.filter(log => new Date(log.timestamp).getTime() >= start);
    }
    if (exportEndDate) {
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);
      const endMs = end.getTime();
      flatLogs = flatLogs.filter(log => new Date(log.timestamp).getTime() <= endMs);
    }

    if (flatLogs.length === 0) {
      alert('Không có dữ liệu lịch sử nào cho các mã đã chọn trong khoảng thời gian này.');
      return;
    }

    const groups: Record<string, any> = {};
    flatLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
      const groupKey = `${dateKey}_${log.subSku}`;
      if (!groups[groupKey]) {
        groups[groupKey] = { date: dateKey, subSku: log.subSku, productName: log.productName, sanXuatNoi: 0, nhapNgoai: 0, xuatKho: 0, hoanTra: 0, loiHong: 0 };
      }
      const action = log.action.toLowerCase();
      if (action.includes('khởi tạo') || action.includes('nhập kho')) {
        if (log.sourceType === 'production') groups[groupKey].sanXuatNoi++;
        else groups[groupKey].nhapNgoai++;
      } else if (action.includes('xuất kho')) {
        groups[groupKey].xuatKho++;
      } else if (action.includes('hoàn kho') || action.includes('hoàn trả')) {
        groups[groupKey].hoanTra++;
      } else if (action.includes('lỗi') || action.includes('hỏng')) {
        groups[groupKey].loiHong++;
      }
    });

    const overviewData = Object.values(groups).sort((a: any, b: any) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return a.subSku.localeCompare(b.subSku);
    }).map(g => ({
      'Ngày': g.date,
      'Sub-SKU': g.subSku,
      'Tên Sản phẩm': g.productName,
      'Sản xuất nội': g.sanXuatNoi,
      'Nhập ngoài': g.nhapNgoai,
      'Xuất kho': g.xuatKho,
      'Hoàn trả': g.hoanTra,
      'Lỗi / Hỏng': g.loiHong
    }));

    const historyData = flatLogs.map(log => ({
      'Ngày giờ': new Date(log.timestamp).toLocaleString('vi-VN'),
      'Mã Lệnh': log.orderCode || '',
      'Sub-SKU': log.subSku,
      'Sản phẩm': log.productName,
      'Mã QR': log.qrCode,
      'Thao tác / Nghiệp vụ': log.action,
      'Người thực hiện': log.operator || '',
      'Khách hàng': log.customerName || '',
      'Tài xế giao hàng': log.driverName || ''
    })).sort((a, b) => new Date(b['Ngày giờ']).getTime() - new Date(a['Ngày giờ']).getTime());

    const wb = utils.book_new();
    const wsOverview = utils.json_to_sheet(overviewData);
    const wsHistory = utils.json_to_sheet(historyData);
    
    wsOverview['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    wsHistory['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 30 }, { wch: 25 }];

    utils.book_append_sheet(wb, wsOverview, 'Tong_quan_ngay');
    utils.book_append_sheet(wb, wsHistory, 'Lich_su_chi_tiet');

    writeFile(wb, `TongHop_TonKho_${new Date().toISOString().split('T')[0]}.xlsx`);

  } catch (err: any) {
    console.error('Export error:', err);
    alert('Đã xảy ra lỗi khi tải Excel: ' + err.message);
  } finally {
    setExportingExcel(false);
  }
};
