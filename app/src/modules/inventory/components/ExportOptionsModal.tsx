import React from 'react';
import { Loader2 } from 'lucide-react';

interface ExportOptionsModalProps {
  exportStartDate: string;
  setExportStartDate: (v: string) => void;
  exportEndDate: string;
  setExportEndDate: (v: string) => void;
  onClose: () => void;
  onExport: () => void;
  exportingExcel: boolean;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  exportStartDate,
  setExportStartDate,
  exportEndDate,
  setExportEndDate,
  onClose,
  onExport,
  exportingExcel
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-black text-slate-800 mb-4">Tùy chọn tải Excel Tổng hợp</h3>
        
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Từ ngày (tùy chọn)</label>
              <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Đến ngày (tùy chọn)</label>
              <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded-lg border border-amber-100">* Nếu để trống cả 2 ô, hệ thống sẽ xuất **toàn bộ** dữ liệu lịch sử từ trước đến nay của các mã đã chọn.</p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Hủy</button>
          <button onClick={() => { onClose(); onExport(); }} disabled={exportingExcel} className="px-6 py-2 bg-emerald-600 text-white font-black rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
            {exportingExcel && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận Tải
          </button>
        </div>
      </div>
    </div>
  );
};
