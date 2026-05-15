import React from 'react';
import { Camera, CalendarDays, Truck, Clock, Fuel } from 'lucide-react';
import { DisplayRow } from './LogsTypes';
import ClickableValue from './ClickableValue';

// ── Table header ──
export const LogsTableHeader: React.FC = () => (
  <thead>
    <tr className="bg-slate-50 border-b border-slate-100">
      <th className="text-left py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider w-10">STT</th>
      <th className="text-left py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
        <CalendarDays className="w-3 h-3 inline mr-1" />Ngày
      </th>
      <th className="text-left py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Loại</th>
      <th className="text-left py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Tài xế</th>
      <th className="text-left py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
        <Truck className="w-3 h-3 inline mr-1" />Biển số
      </th>
      <th className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">KM đầu</th>
      <th className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">KM cuối</th>
      <th className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Tổng KM</th>
      <th className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">KM đổ xăng</th>
      <th className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Chi phí</th>
      <th className="text-right py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Giá/lít</th>
      <th className="text-left py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Hóa đơn sửa chữa</th>
      <th className="text-left py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Chi tiết sửa chữa</th>
      <th className="text-center py-3 px-3 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Trạng thái</th>
    </tr>
  </thead>
);

// ── Single table row ──
interface LogsTableRowProps {
  row: DisplayRow;
  stt: number;
  onViewPhoto: (src: string, alt: string) => void;
}

export const LogsTableRow: React.FC<LogsTableRowProps> = ({ row, stt, onViewPhoto }) => {
  const isSession = row.type === 'session';
  const isFuel = row.type === 'fuel';
  const fuel = row.fuelEntry;
  const log = row.log;

  // Highlight: negative totalKm is red
  const totalKmBad = log.totalKm !== null && log.totalKm < 0;

  return (
    <tr
      className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${
        isFuel ? 'bg-amber-50/20' : ''
      }`}
    >
      {/* STT */}
      <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">{stt}</td>

      {/* Ngày — only show on first row of group */}
      <td className="py-3 px-3">
        {row.isFirst ? (
          <>
            <p className="font-bold text-slate-800">
              {new Date(log.logDate).toLocaleDateString('vi-VN')}
            </p>
            {log.checkInTime && (
              <p className="text-[9px] text-slate-400 mt-0.5">
                {new Date(log.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                {log.checkOutTime && ` → ${new Date(log.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
          </>
        ) : (
          <span className="text-[9px] text-slate-300 pl-2">└</span>
        )}
      </td>

      {/* Loại */}
      <td className="py-3 px-3">
        {isSession ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
            <Clock className="w-3 h-3" /> Ca
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
            <Fuel className="w-3 h-3" /> Xăng
          </span>
        )}
      </td>

      {/* Tài xế */}
      <td className="py-3 px-3">
        {row.isFirst ? (
          <>
            <p className="font-bold text-slate-800 truncate max-w-[120px]">{log.driverName}</p>
            {log.driver?.code && (
              <p className="text-[9px] text-slate-400 font-mono">{log.driver.code}</p>
            )}
          </>
        ) : null}
      </td>

      {/* Biển số */}
      <td className="py-3 px-3">
        {row.isFirst ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-black rounded-md tracking-wider">
              {log.plateNumber}
            </span>
            {log.startKmPhoto && (
              <button
                onClick={() => onViewPhoto(log.startKmPhoto!, `Ảnh check-in — ${log.plateNumber}`)}
                className="w-6 h-6 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors"
                title="Xem ảnh biển số (check-in)"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : null}
      </td>

      {/* KM đầu */}
      <td className="py-3 px-3 text-right">
        {isSession ? (
          <ClickableValue value={log.startKm} photo={log.startKmPhoto} format="km" onViewPhoto={onViewPhoto} label={`KM bắt đầu — ${log.plateNumber}`} />
        ) : <span className="text-slate-200">—</span>}
      </td>

      {/* KM cuối */}
      <td className="py-3 px-3 text-right">
        {isSession ? (
          <ClickableValue value={log.endKm} photo={log.endKmPhoto} format="km" onViewPhoto={onViewPhoto} label={`KM kết thúc — ${log.plateNumber}`} audit={log.ocrAudits?.[0]} />
        ) : <span className="text-slate-200">—</span>}
      </td>

      {/* Tổng KM */}
      <td className="py-3 px-3 text-right">
        {isSession && log.totalKm !== null ? (
          <span className={`font-black ${totalKmBad ? 'text-red-600' : 'text-emerald-600'}`}>
            {totalKmBad ? '' : '+'}{log.totalKm.toLocaleString('vi-VN')} km
          </span>
        ) : isSession && log.status === 'active' ? (
          <span className="text-[10px] text-amber-500 font-bold animate-pulse">Đang chạy...</span>
        ) : <span className="text-slate-200">—</span>}
      </td>

      {/* KM đổ xăng */}
      <td className="py-3 px-3 text-right">
        {isFuel && fuel ? (
          <ClickableValue value={fuel.fuelKm} photo={fuel.fuelKmPhoto} format="km" onViewPhoto={onViewPhoto} label={`KM đổ xăng — ${log.plateNumber}`} />
        ) : <span className="text-slate-200">—</span>}
      </td>

      {/* Chi phí */}
      <td className="py-3 px-3 text-right">
        {isFuel && fuel ? (
          <ClickableValue value={fuel.fuelCost} photo={fuel.fuelCostPhoto} format="currency" onViewPhoto={onViewPhoto} label={`Hóa đơn xăng — ${log.plateNumber}`} audit={fuel.ocrAudits?.[0]} />
        ) : <span className="text-slate-200">—</span>}
      </td>

      {/* Giá/lít */}
      <td className="py-3 px-3 text-right">
        {isFuel && fuel ? (
          <ClickableValue value={fuel.fuelPricePerLiter} photo={fuel.fuelPricePhoto} format="price" onViewPhoto={onViewPhoto} label={`Giá/lít — ${log.plateNumber}`} />
        ) : <span className="text-slate-200">—</span>}
      </td>

      {/* Hóa đơn Sửa chữa (Reserved) */}
      <td className="py-3 px-3 text-left">
        <span className="text-slate-200">—</span>
      </td>

      {/* Chi tiết Sửa chữa (Reserved) */}
      <td className="py-3 px-3 text-left">
        <span className="text-slate-200">—</span>
      </td>

      {/* Trạng thái */}
      <td className="py-3 px-3 text-center">
        {isSession ? (
          log.status === 'active' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              ● Đang chạy
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
              Hoàn thành
            </span>
          )
        ) : null}
      </td>
    </tr>
  );
};
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          