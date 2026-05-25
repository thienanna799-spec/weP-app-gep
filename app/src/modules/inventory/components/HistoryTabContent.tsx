import React from 'react';
import { X } from 'lucide-react';
import { LifecycleHistoryTable } from './LifecycleHistoryTable';
import { OrdersHistoryTable } from './OrdersHistoryTable';

interface HistoryTabContentProps {
  historyFilterDate: string | null;
  historyFilterType: string | null;
  setHistoryFilterDate: (v: string | null) => void;
  setHistoryFilterType: (v: string | null) => void;
  historyViewMode: 'lifecycle' | 'orders' | 'in_stock';
  setHistoryViewMode: (v: 'lifecycle' | 'orders') => void;
  agingFilter: number;
  setAgingFilter: (v: number) => void;
  loadingHistory: boolean;
  lifecycleGroups: any[];
  orderGroups: any[];
  expandedQrCodes: Set<string>;
  toggleExpand: (qrCode: string) => void;
  rollTimelineCache: Record<string, { loading: boolean; events: any[] }>;
  exportOrderExcel: (orderCode: string, logs: any[], subSkuSafe: string) => void;
  subSkuSafe: string;
}

const AGING_OPTIONS = [
  { value: 0, label: 'Tất cả' },
  { value: 3, label: '> 3 ngày' },
  { value: 7, label: '> 7 ngày' },
  { value: 14, label: '> 14 ngày' },
  { value: 30, label: '> 30 ngày' },
];

export const HistoryTabContent: React.FC<HistoryTabContentProps> = ({
  historyFilterDate, historyFilterType, setHistoryFilterDate, setHistoryFilterType,
  historyViewMode, setHistoryViewMode, agingFilter, setAgingFilter,
  loadingHistory, lifecycleGroups, orderGroups, expandedQrCodes, toggleExpand,
  rollTimelineCache, exportOrderExcel, subSkuSafe
}) => {
  return (
    <div>
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
            Chi tiết Cuộn & Lịch sử
            {(historyFilterDate || historyFilterType) && (
              <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                Lọc: {historyFilterDate} {historyFilterType && `- ${historyFilterType}`}
                <button onClick={() => { setHistoryFilterDate(null); setHistoryFilterType(null); }} className="hover:text-red-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </h3>
          
          {historyViewMode === 'in_stock' && (
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              {AGING_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setAgingFilter(f.value)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    agingFilter === f.value 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
          <button onClick={() => setHistoryViewMode('lifecycle')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${historyViewMode === 'lifecycle' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Định danh Cuộn & Lịch sử</button>
          <button onClick={() => setHistoryViewMode('orders')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${historyViewMode === 'orders' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Nhóm theo Lệnh</button>
        </div>
      </div>

      {historyViewMode === 'lifecycle' && (
        <LifecycleHistoryTable 
          loadingHistory={loadingHistory}
          lifecycleGroups={lifecycleGroups}
          expandedQrCodes={expandedQrCodes}
          toggleExpand={toggleExpand}
          rollTimelineCache={rollTimelineCache}
        />
      )}

      {historyViewMode === 'orders' && (
        <OrdersHistoryTable 
          loadingHistory={loadingHistory}
          orderGroups={orderGroups}
          exportOrderExcel={exportOrderExcel}
          subSkuSafe={subSkuSafe}
        />
      )}
    </div>
  );
};
