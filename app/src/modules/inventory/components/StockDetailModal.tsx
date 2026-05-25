/**
 * StockDetailModal — Product detail popup with rolls table, aging filter, import & delete
 * ────────────────────────────────────────────────────────────────────────────────────────
 * Extracted from InventorySummaryTab for maintainability.
 */

import React, { useState } from 'react';
import { X, PackagePlus, Trash2, Box, BarChart2, Settings } from 'lucide-react';
import QuickImportForm from './QuickImportForm';
import { StockRow } from '../hooks/useStockSummary';
import { ProductRoll } from '../types';
import { useRollHistory } from '../hooks/useRollHistory';
import { HistoryTabContent } from './HistoryTabContent';
import { OverviewTabContent } from './OverviewTabContent';
import { ProductInfoModal } from './ProductInfoModal';
import { StockStatCards } from './StockStatCards';

interface StockDetailModalProps {
  selectedRow: StockRow;
  onClose: () => void;
  filteredRolls: ProductRoll[];
  agingFilter: number;
  setAgingFilter: (v: number) => void;
  onRollClick?: (roll: ProductRoll) => void;
  // Import goods
  importQty: string;
  setImportQty: (v: string) => void;
  importQuick: boolean;
  setImportQuick: (v: boolean) => void;
  importing: boolean;
  onImportGoods: () => void;
  importedBatch: any | null;
  showImportForm: boolean;
  setShowImportForm: (v: boolean) => void;
  // Delete
  onDeleteProductGroup: () => void;
  // Export
  onExportExcel: () => void;
}

const StockDetailModal: React.FC<StockDetailModalProps> = ({
  selectedRow, onClose, filteredRolls,
  agingFilter, setAgingFilter, onRollClick,
  importQty, setImportQty, importQuick, setImportQuick,
  importing, onImportGoods, importedBatch,
  showImportForm, setShowImportForm,
  onDeleteProductGroup, onExportExcel
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'overview'>('overview');
  const [showInfo, setShowInfo] = useState(false);
  
  const h = useRollHistory(selectedRow?.subSku, filteredRolls);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900">{selectedRow.productName || 'Sản phẩm chưa xác định'}</h2>
            <p className="text-sm text-slate-500 font-mono mt-1">
              XƯỞNG: {selectedRow.supplier || '—'} | SUB-SKU: {selectedRow.subSku || '—'}
            </p>
            {selectedRow.sku && (
              <p className="text-sm font-mono mt-0.5 text-slate-400">
                SKU: <span className="text-indigo-600 font-bold">{selectedRow.sku}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInfo(true)} 
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 hover:border-indigo-200"
              title="Thông tin chi tiết sản phẩm"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-bold">Cài đặt & Thông tin</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={() => setShowImportForm(!showImportForm)} 
              className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition-colors border ${showImportForm ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <PackagePlus className="w-5 h-5" />
              Nhập thêm hàng
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button onClick={onDeleteProductGroup} className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200">
              <Trash2 className="w-5 h-5" />
              <span className="text-sm font-bold">Xóa sản phẩm</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 space-y-6">

          {/* Product Info Modal */}
          {showInfo && (
            <ProductInfoModal 
              selectedRow={selectedRow}
              onClose={() => setShowInfo(false)}
            />
          )}
          
          {/* Quick Import Form */}
          {showImportForm && (
            <QuickImportForm
              importQty={importQty}
              setImportQty={setImportQty}
              importQuick={importQuick}
              setImportQuick={setImportQuick}
              importing={importing}
              onSubmit={onImportGoods}
              importedBatch={importedBatch}
            />
          )}

          {/* 5 Stat Cards */}
          <StockStatCards selectedRow={selectedRow} />

          {/* Tabs Menu */}
          <div className="flex border-b border-slate-200 gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BarChart2 className="w-4 h-4" />
              Tổng quan Biến động theo ngày
              {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Box className="w-4 h-4" />
              Chi tiết Cuộn & Lịch sử
              {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTabContent 
              loadingHistory={h.loadingHistory}
              dailyOverview={h.dailyOverview}
              jumpToHistory={(date, type) => { h.jumpToHistory(date, type); setActiveTab('history'); }}
            />
          )}

          {/* Rolls & History Tab Content */}
          {activeTab === 'history' && (
            <HistoryTabContent 
              historyFilterDate={h.historyFilterDate}
              historyFilterType={h.historyFilterType}
              setHistoryFilterDate={h.setHistoryFilterDate}
              setHistoryFilterType={h.setHistoryFilterType}
              historyViewMode={h.historyViewMode as any}
              setHistoryViewMode={h.setHistoryViewMode as any}
              agingFilter={agingFilter}
              setAgingFilter={setAgingFilter}
              loadingHistory={h.loadingHistory}
              lifecycleGroups={h.lifecycleGroups}
              orderGroups={h.orderGroups}
              expandedQrCodes={h.expandedQrCodes}
              toggleExpand={h.toggleExpand}
              rollTimelineCache={h.rollTimelineCache}
              exportOrderExcel={h.exportOrderExcel}
              subSkuSafe={(selectedRow.subSku || 'Unknown').replace(/[^a-zA-Z0-9-]/g, '_')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
