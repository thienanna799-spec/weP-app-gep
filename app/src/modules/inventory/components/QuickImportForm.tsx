/**
 * QuickImportForm — Inline form for quick goods import within the stock detail modal
 * ───────────────────────────────────────────────────────────────────────────────────
 * Extracted from InventorySummaryTab for maintainability.
 */

import React from 'react';
import { PackagePlus, Zap, Loader2, Printer } from 'lucide-react';
import { printBatchQRs } from '../../../utils/printQR';

interface QuickImportFormProps {
  importQty: string;
  setImportQty: (v: string) => void;
  importQuick: boolean;
  setImportQuick: (v: boolean) => void;
  importing: boolean;
  onSubmit: () => void;
  importedBatch: any | null;
}

const QuickImportForm: React.FC<QuickImportFormProps> = ({
  importQty, setImportQty,
  importQuick, setImportQuick,
  importing, onSubmit,
  importedBatch
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in slide-in-from-top-2">
      <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2 mb-4">
        <PackagePlus className="w-4 h-4" /> Khai báo nhập hàng (Sinh mã QR)
      </h3>
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="w-full md:w-1/3">
          <label className="text-xs font-bold text-slate-600 block mb-1">SỐ LƯỢNG (pcs)</label>
          <input 
            type="number" min="1" step="1" placeholder="Nhập số lượng..." 
            value={importQty} onChange={e => setImportQty(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 border-indigo-100 focus:border-indigo-400 outline-none transition-all font-bold text-indigo-800"
          />
        </div>
        
        <div 
          onClick={() => setImportQuick(!importQuick)}
          className={`flex-1 w-full p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 ${importQuick ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <Zap className={`w-5 h-5 mt-0.5 ${importQuick ? 'text-emerald-600' : 'text-slate-400'}`} />
          <div>
            <p className={`text-sm font-bold ${importQuick ? 'text-emerald-700' : 'text-slate-700'}`}>Nhập kho nhanh</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Không cần dùng điện thoại quét mã — sản phẩm tự động ở trạng thái <strong>Tồn kho thực tế</strong>. Vẫn sinh ra mã QR để dán.</p>
          </div>
        </div>
        
        <div className="w-full md:w-auto self-stretch flex items-end">
          <button 
            onClick={onSubmit}
            disabled={importing || !importQty}
            className="w-full md:w-auto h-[46px] px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu & Sinh mã QR'}
          </button>
        </div>
      </div>
      
      {importedBatch && importedBatch.rolls && (
        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-200">
          <div>
            <p className="font-bold text-green-800">✅ Tạo thành công {importedBatch.rolls.length} mã QR</p>
            <p className="text-xs text-green-600 mt-1">Lô hàng: {importedBatch.id.slice(-6).toUpperCase()}</p>
          </div>
          <button 
            onClick={() => printBatchQRs(importedBatch.rolls!, importedBatch.productName, importedBatch.specification, importedBatch.id)}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm shadow-sm flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" /> In mã QR ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickImportForm;
