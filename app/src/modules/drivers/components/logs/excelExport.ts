import * as XLSX from 'xlsx';
import { DisplayRow } from './LogsTypes';

export const exportLogsToExcel = (displayRows: DisplayRow[], dateFrom: string, dateTo: string) => {
  const exportData = displayRows.map((row, idx) => {
    const isFuel = row.type === 'fuel';
    const log = row.log;
    const fuel = row.fuelEntry;

    const dateObj = new Date(isFuel ? fuel!.createdAt : log.checkInTime);
    const dateStr = dateObj.toLocaleDateString('vi-VN');
    const timeStr = dateObj.toLocaleTimeString('vi-VN');

    return {
      'STT': idx + 1,
      'Ngày': `${dateStr} ${timeStr}`,
      'Loại': isFuel ? 'Đổ xăng' : 'Ca làm việc',
      'Tài xế': log.driverName,
      'Biển số': log.plateNumber,
      'KM đầu': !isFuel ? log.startKm : '',
      'KM cuối': !isFuel ? (log.endKm || '') : '',
      'Tổng KM': !isFuel ? (log.totalKm || '') : '',
      'KM đổ xăng': isFuel ? (fuel!.fuelKm || '') : '',
      'Chi phí': isFuel ? (fuel!.fuelCost || '') : '',
      'Giá/lít': isFuel && fuel!.fuelVolume && fuel!.fuelVolume > 0 ? Math.round((fuel!.fuelCost || 0) / fuel!.fuelVolume) : '',
      'Hóa đơn Sửa chữa': '', // Reserved for APK Repair feature
      'Chi tiết Sửa chữa': '', // Reserved for APK Repair feature
      'Trạng thái': isFuel ? 'Hoàn tất' : (log.status === 'active' ? 'Đang chạy' : 'Đã kết thúc')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "NhatKy");
  
  XLSX.writeFile(workbook, `NhatKy_TaiXe_${dateFrom}_${dateTo}.xlsx`);
};
