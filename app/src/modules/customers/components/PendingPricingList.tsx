import React from 'react';
import { Plus, Search, X, Loader2 } from 'lucide-react';

export interface PendingPricing {
  sku: string;
  price: number;
  subSkus: string[];
}

interface Props {
  pendingPricing: PendingPricing[];
  showAddPricing: boolean;
  setShowAddPricing: (val: boolean) => void;
  newSkuInput: string;
  setNewSkuInput: (val: string) => void;
  newPriceInput: string;
  setNewPriceInput: (val: string) => void;
  handleAddPendingSku: () => void;
  searchingSku: boolean;
  removePendingSku: (idx: number) => void;
}

const PendingPricingList: React.FC<Props> = ({
  pendingPricing, showAddPricing, setShowAddPricing,
  newSkuInput, setNewSkuInput, newPriceInput, setNewPriceInput,
  handleAddPendingSku, searchingSku, removePendingSku
}) => {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-amber-600 uppercase">💰 Bảng giá SKU</p>
          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">{pendingPricing.length} SKU</span>
        </div>
        <button onClick={() => setShowAddPricing(!showAddPricing)}
          className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
          <Plus className="w-3 h-3" />Thêm SKU
        </button>
      </div>

      {showAddPricing && (
        <div className="flex gap-2 items-end mb-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex-1">
            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Mã SKU *</label>
            <input value={newSkuInput} onChange={e => setNewSkuInput(e.target.value)} placeholder="PLAIN--BLACK-L"
              className="w-full h-8 rounded border border-slate-200 px-2 text-[11px] font-mono"
              onKeyDown={e => e.key === 'Enter' && handleAddPendingSku()} />
          </div>
          <div className="w-24">
            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Giá bán *</label>
            <input value={newPriceInput} onChange={e => setNewPriceInput(e.target.value)} placeholder="0"
              className="w-full h-8 rounded border border-slate-200 px-2 text-[11px] font-bold text-right"
              onKeyDown={e => e.key === 'Enter' && handleAddPendingSku()} />
          </div>
          <button onClick={handleAddPendingSku} disabled={searchingSku}
            className="h-8 px-3 bg-blue-600 text-white text-[11px] font-bold rounded hover:bg-blue-700 disabled:opacity-50">
            {searchingSku ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Search className="w-3 h-3 inline mr-1" />Tìm</>}
          </button>
          <button onClick={() => setShowAddPricing(false)} className="h-8 px-1.5 text-slate-400 hover:bg-slate-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {pendingPricing.length > 0 ? (
        <div className="border border-amber-100 rounded-lg overflow-hidden bg-white">
          <div className="grid grid-cols-[30px_1.5fr_2fr_80px_30px] gap-1 px-2 py-1 bg-amber-50 text-[9px] font-bold text-amber-700 uppercase">
            <span>#</span><span>SKU</span><span>SUB-SKU tìm thấy</span><span className="text-right">Giá</span><span></span>
          </div>
          {pendingPricing.map((pp, idx) => (
            <div key={idx} className="grid grid-cols-[30px_1.5fr_2fr_80px_30px] gap-1 px-2 py-1.5 items-center border-t border-amber-100 hover:bg-amber-50/30">
              <span className="text-[10px] text-slate-400">{idx + 1}</span>
              <span className="text-[11px] font-mono font-bold text-indigo-700">{pp.sku}</span>
              <div className="flex flex-wrap gap-1">
                {pp.subSkus.length > 0 ? pp.subSkus.map((ss, si) => (
                  <span key={si} className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">{ss}</span>
                )) : <span className="text-[9px] text-slate-400 italic">Chưa có trong kho</span>}
              </div>
              <span className="text-[11px] font-bold text-amber-700 text-right">{pp.price.toLocaleString('vi-VN')}</span>
              <button onClick={() => removePendingSku(idx)} className="p-0.5 text-red-400 hover:bg-red-50 rounded"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      ) : !showAddPricing && (
        <p className="text-[11px] text-slate-400 italic text-center py-1">Bấm "+ Thêm SKU" để khai báo giá cho KH mới.</p>
      )}
    </div>
  );
};

export default PendingPricingList;
