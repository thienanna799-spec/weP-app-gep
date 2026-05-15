import React, { useState, useEffect } from 'react';
import { Filter, Calendar, X } from 'lucide-react';
import api from '../../../services/api';

interface FilterOptions {
  machines: string[];
  products: string[];
  customers: { id: string; name: string }[];
  drivers: { id: string; name: string }[];
}

export interface ReportFilterValues {
  from: string;
  to: string;
  machine: string;
  productType: string;
  customerId: string;
  driverId: string;
}

interface Props {
  filters: ReportFilterValues;
  onChange: (f: ReportFilterValues) => void;
}

const ReportFilters: React.FC<Props> = ({ filters, onChange }) => {
  const [options, setOptions] = useState<FilterOptions>({ machines: [], products: [], customers: [], drivers: [] });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.get<FilterOptions>('/reports/filters').then(setOptions).catch(console.error);
  }, []);

  const update = (key: keyof ReportFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    onChange({ from, to: now.toISOString().slice(0, 10), machine: '', productType: '', customerId: '', driverId: '' });
  };

  const hasActiveFilters = filters.machine || filters.productType || filters.customerId || filters.driverId;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Compact date range + toggle */}
      <div className="flex items-center gap-3 p-4">
        <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex items-center gap-2">
          <input type="date" value={filters.from} onChange={e => update('from', e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium bg-slate-50 focus:border-blue-500 outline-none" />
          <span className="text-slate-400 text-sm">→</span>
          <input type="date" value={filters.to} onChange={e => update('to', e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium bg-slate-50 focus:border-blue-500 outline-none" />
        </div>
        <div className="flex-1" />
        <button onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${expanded ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
          <Filter className="w-4 h-4" />
          Bộ lọc {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
        </button>
        {hasActiveFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100">
            <X className="w-3 h-3" /> Xóa lọc
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 pb-4 border-t border-slate-100 pt-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Máy / Khu vực</label>
            <select value={filters.machine} onChange={e => update('machine', e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Tất cả</option>
              {options.machines.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Sản phẩm</label>
            <select value={filters.productType} onChange={e => update('productType', e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Tất cả</option>
              {options.products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Khách hàng</label>
            <select value={filters.customerId} onChange={e => update('customerId', e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Tất cả</option>
              {options.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tài xế</label>
            <select value={filters.driverId} onChange={e => update('driverId', e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="">Tất cả</option>
              {options.drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportFilters;
