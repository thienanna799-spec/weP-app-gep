/**
 * StockSyncPanel — Excel sync preview + result display
 */

import React from 'react';
import { FileSpreadsheet, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface SyncResult {
  summary: { totalRows: number; matched: number; notFound: number; updated: number };
  errors: { row: number; message: string }[];
  details: { row: number; supplier: string; subSku: string; status: string; oldQty: number; newQty: number }[];
}

interface Props {
  syncResult: SyncResult | null;
  previewRows: Record<string, any>[] | null;
  importing: boolean;
  onSync: () => void;
  onCancel: () => void;
}

const StockSyncPanel: React.FC<Props> = ({ syncResult, previewRows, importing, onSync, onCancel }) => {
  if (!previewRows && !syncResult) return null;

  return (
    <Card className="overflow-hidden border-2 border-indigo-200 bg-indigo-50/20">
      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200 flex justify-between items-center">
        <h4 className="text-sm font-bold text-indigo-700 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          {syncResult ? 'Kết quả đồng bộ' : 'Xem trước dữ liệu import'}
        </h4>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-500"><X className="w-4 h-4" /></button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
              <p className="text-xl font-black text-slate-700">{syncResult.summary.totalRows}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Tổng dòng</p>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-green-200">
              <p className="text-xl font-black text-green-600">{syncResult.summary.matched}</p>
              <p className="text-[9px] font-bold text-green-400 uppercase">Khớp</p>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-blue-200">
              <p className="text-xl font-black text-blue-600">{syncResult.summary.updated}</p>
              <p className="text-[9px] font-bold text-blue-400 uppercase">Cập nhật</p>
            </div>
            <div className="text-center p-3 bg-white rounded-xl border border-red-200">
              <p className="text-xl font-black text-red-600">{syncResult.summary.notFound}</p>
              <p className="text-[9px] font-bold text-red-400 uppercase">Không tìm thấy</p>
            </div>
          </div>

          {syncResult.details.filter(d => d.status === 'updated' || d.status === 'created').length > 0 && (
            <div className="max-h-[200px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-green-50 sticky top-0">
                  <tr className="text-[10px] text-green-600 font-bold uppercase">
                    <th className="px-3 py-2 text-left">XƯỞNG</th><th className="px-3 py-2 text-left">SUB-SKU</th>
                    <th className="px-3 py-2 text-right">Cũ</th><th className="px-3 py-2 text-center">→</th><th className="px-3 py-2 text-right">Mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-100">
                  {syncResult.details.filter(d => d.status === 'updated' || d.status === 'created').map((d, i) => (
                    <tr key={i} className={`hover:bg-green-50/50 ${d.status === 'created' ? 'bg-emerald-50' : ''}`}>
                      <td className="px-3 py-1.5">{d.supplier}</td>
                      <td className="px-3 py-1.5 font-mono">{d.subSku}</td>
                      <td className="px-3 py-1.5 text-right text-slate-500">{d.oldQty}</td>
                      <td className="px-3 py-1.5 text-center text-green-500 font-bold">→</td>
                      <td className="px-3 py-1.5 text-right font-bold text-green-700">{d.newQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {syncResult.errors.length > 0 && (
            <div className="max-h-[150px] overflow-auto bg-red-50 rounded-lg p-3">
              <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Lỗi ({syncResult.errors.length})
              </p>
              {syncResult.errors.map((err, i) => (
                <p key={i} className="text-[11px] text-red-600">Dòng {err.row}: {err.message}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Table */}
      {previewRows && !syncResult && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Hiển thị {previewRows.length} dòng đầu tiên. Cần có cột: <strong>XƯỞNG</strong> và <strong>SUB-SKU</strong>
          </p>
          <div className="max-h-[300px] overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs min-w-[500px]">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-3 py-2.5 text-left">#</th>
                  {Object.keys(previewRows[0] || {}).map(h => (
                    <th key={h} className="px-3 py-2.5 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50">
                    <td className="px-3 py-1.5 text-slate-400 font-mono">{idx + 1}</td>
                    {Object.values(row).map((val, vi) => (
                      <td key={vi} className="px-3 py-1.5 whitespace-nowrap">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onCancel} className="flex-1 text-sm">Hủy</Button>
            <Button onClick={onSync} disabled={importing} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-sm gap-1.5">
              {importing ? <LoadingSpinner /> : <><CheckCircle2 className="w-4 h-4" /> Đồng bộ vào hệ thống</>}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StockSyncPanel;
