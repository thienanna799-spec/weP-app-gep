import React from 'react';
import { RefreshCw, Download } from 'lucide-react';
import Card from '../../../../components/ui/Card';

interface LogsFilterBarProps {
  dateFrom: string;
  dateTo: string;
  filterPlate: string;
  filterDriver: string;
  drivers: { id: string; name: string }[];
  vehicles: { id: string; plateNumber: string }[];
  loading: boolean;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onFilterPlateChange: (v: string) => void;
  onFilterDriverChange: (v: string) => void;
  onRefresh: () => void;
  onExport?: () => void;
}

export const LogsFilterBar: React.FC<LogsFilterBarProps> = ({
  dateFrom, dateTo, filterPlate, filterDriver,
  drivers, vehicles, loading,
  onDateFromChange, onDateToChange, onFilterPlateChange, onFilterDriverChange,
  onRefresh, onExport
}) => (
  <Card className="p-4 border-none shadow-sm">
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[140px]">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Từ ngày</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
        />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Đến ngày</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
        />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Biển số xe</label>
        <select
          value={filterPlate}
          onChange={(e) => onFilterPlateChange(e.target.value)}
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
        >
          <option value="">Tất cả xe</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.plateNumber}>{v.plateNumber}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tài xế</label>
        <select
          value={filterDriver}
          onChange={(e) => onFilterDriverChange(e.target.value)}
          className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
        >
          <option value="">Tất cả tài xế</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className={`h-9 px-4 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 ${loading ? 'opacity-50' : ''}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Lọc
        </button>
        {onExport && (
          <button
            onClick={onExport}
            className="h-9 px-4 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
            title="Xuất file Excel"
          >
            <Download className="w-3.5 h-3.5" />
            Xuất Excel
          </button>
        )}
      </div>
    </div>
  </Card>
);
