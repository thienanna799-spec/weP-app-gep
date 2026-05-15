import React from 'react';
import { Loader2, X, Check, Power } from 'lucide-react';

export interface FlatRow {
  subSku: string;
  sku: string;
  tonKho: number;
  price: number;
  pricingId: string;
  isSubSkuActive: boolean;
  updatedByName?: string;
  updatedAt: string;
}

interface Props {
  flatRows: FlatRow[];
  loadingStock: boolean;
  editingId: string | null;
  editPrice: string;
  setEditPrice: (val: string) => void;
  saving: boolean;
  toggling: string | null;
  startEdit: (row: FlatRow) => void;
  saveEdit: (prId: string) => void;
  cancelEdit: () => void;
  handleKeyDown: (e: React.KeyboardEvent, prId: string) => void;
  handleToggleSubSku: (subSku: string) => void;
}

const PricingTable: React.FC<Props> = ({
  flatRows, loadingStock, editingId, editPrice, setEditPrice, saving, toggling,
  startEdit, saveEdit, cancelEdit, handleKeyDown, handleToggleSubSku
}) => {
  return (
    <div className="border border-amber-100 rounded-xl overflow-hidden bg-amber-50/30">
      <table className="w-full text-left">
        <thead className="bg-amber-50">
          <tr>
            <th className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase w-8">#</th>
            <th className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase">SUB-SKU</th>
            <th className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase">SKU</th>
            <th className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase text-center w-20">Tồn kho</th>
            <th className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase text-right">Giá bán</th>
            <th className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase text-center w-24">Trạng thái</th>
            <th className="px-3 py-2 text-[10px] font-bold text-amber-700 uppercase text-right w-24">Người sửa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100">
          {flatRows.map((row, idx) => {
            const inactive = !row.isSubSkuActive;
            return (
              <tr key={`${row.subSku}-${idx}`}
                className={`transition-colors ${inactive ? 'bg-red-50/40' : 'bg-white hover:bg-amber-50/50'}`}>
                <td className="px-3 py-2 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                <td className={`px-3 py-2 text-[11px] font-mono font-bold ${inactive ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {row.subSku}
                </td>
                <td className={`px-3 py-2 text-xs font-mono font-bold ${inactive ? 'text-slate-400' : 'text-indigo-700'}`}>
                  {row.sku}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-xs font-bold ${row.tonKho > 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                    {row.tonKho.toLocaleString('vi-VN')}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {editingId === row.pricingId ? (
                    <div className="flex items-center gap-1 justify-end">
                      <input type="text" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, row.pricingId)} autoFocus
                        className="w-24 text-xs text-right font-bold border border-amber-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white" />
                      <button onClick={() => saveEdit(row.pricingId)} disabled={saving}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-lg" title="Lưu (Enter)">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg" title="Hủy (Esc)">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => !inactive && startEdit(row)}
                      className={`text-xs font-bold px-2 py-0.5 rounded transition-all ${
                        inactive ? 'text-slate-400 cursor-not-allowed' : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100 cursor-pointer'
                      }`}
                      disabled={inactive}
                      title={inactive ? 'Đang dừng bán' : 'Click để sửa giá'}>
                      {row.price.toLocaleString('vi-VN')}
                    </button>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => handleToggleSubSku(row.subSku)}
                    disabled={toggling === row.subSku || row.subSku === '—'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                      inactive
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    } ${row.subSku === '—' ? 'opacity-30 cursor-not-allowed' : ''}`}>
                    {toggling === row.subSku ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                    {inactive ? 'Dừng' : 'Bán'}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {row.updatedByName && <span className="font-medium text-slate-600 block">{row.updatedByName}</span>}
                    <span>{new Date(row.updatedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </td>
              </tr>
            );
          })}
          {flatRows.length === 0 && !loadingStock && (
            <tr><td colSpan={7} className="text-center py-6 text-xs text-slate-400 italic">
              Chưa có sản phẩm. Bấm "+ Thêm SKU" hoặc dùng "Import giá bán".
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PricingTable;
