/**
 * StockFilterBar — Search + advanced filter controls
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import Card from '../../../components/ui/Card';

interface Props {
  searchTerm: string; setSearchTerm: (v: string) => void;
  showFilters: boolean; setShowFilters: (v: boolean) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  filterSupplier: string; setFilterSupplier: (v: string) => void;
  filterSubSku: string; setFilterSubSku: (v: string) => void;
  filterProductName: string; setFilterProductName: (v: string) => void;
  filterSku: string; setFilterSku: (v: string) => void;
  filterSpec: string; setFilterSpec: (v: string) => void;
  filterDateFrom: string; setFilterDateFrom: (v: string) => void;
  filterDateTo: string; setFilterDateTo: (v: string) => void;
  uniqueSuppliers: string[];
  uniqueProducts: string[];
  uniqueSkus: string[];
  actionButtons?: React.ReactNode;
}

const StockFilterBar: React.FC<Props> = ({
  searchTerm, setSearchTerm, showFilters, setShowFilters, activeFilterCount, clearFilters,
  filterSupplier, setFilterSupplier, filterSubSku, setFilterSubSku,
  filterProductName, setFilterProductName, filterSku, setFilterSku,
  filterSpec, setFilterSpec, filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
  uniqueSuppliers, uniqueProducts, uniqueSkus, actionButtons
}) => (
  <Card className="p-4 bg-white space-y-3">
    <div className="flex flex-col xl:flex-row gap-2">
      <input type="text" placeholder="Tìm kiếm nhanh theo xưởng, sub-sku, tên SP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
      <button onClick={() => setShowFilters(!showFilters)}
        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'}`}>
        <Search className="w-3.5 h-3.5" /> Bộ lọc {activeFilterCount > 0 && <span className="bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
      </button>
      {activeFilterCount > 0 && (
        <button onClick={clearFilters} className="px-3 py-2 rounded-lg text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 flex items-center gap-1 whitespace-nowrap">
          <X className="w-3 h-3" /> Xóa lọc
        </button>
      )}
      {actionButtons && (
        <div className="flex items-center gap-2 border-t xl:border-t-0 xl:border-l border-slate-200 pt-2 xl:pt-0 xl:pl-2 xl:ml-1 overflow-x-auto pb-1 xl:pb-0 custom-scrollbar">
          {actionButtons}
        </div>
      )}
    </div>

    {showFilters && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Xưởng</label>
          <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
            <option value="">Tất cả</option>
            {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Sub-SKU</label>
          <input type="text" placeholder="Nhập sub-sku..." value={filterSubSku} onChange={e => setFilterSubSku(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Tên SP</label>
          <select value={filterProductName} onChange={e => setFilterProductName(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
            <option value="">Tất cả</option>
            {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">SKU</label>
          <select value={filterSku} onChange={e => setFilterSku(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400">
            <option value="">Tất cả</option>
            {uniqueSkus.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Quy cách</label>
          <input type="text" placeholder="Nhập quy cách..." value={filterSpec} onChange={e => setFilterSpec(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Từ ngày</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate