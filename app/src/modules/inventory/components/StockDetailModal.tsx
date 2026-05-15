/**
 * StockDetailModal — Product detail popup with rolls table, aging filter, import & delete
 * ────────────────────────────────────────────────────────────────────────────────────────
 * Extracted from InventorySummaryTab for maintainability.
 */

import React, { useState } from 'react';
import { X, PackagePlus, Trash2, Download } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { InventoryRollsTable } from './InventoryRollsTable';
import QuickImportForm from './QuickImportForm';
import { StockRow } from '../hooks/useStockSummary';
import { ProductRoll } from '../types';

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

const AGING_OPTIONS = [
  { value: 0, label: 'Tất cả' },
  { value: 3, label: '> 3 ngày' },
  { value: 7, label: '> 7 ngày' },
  { value: 14, label: '> 14 ngày' },
  { value: 30, label: '> 30 ngày' },
];

const StockDetailModal: React.FC<StockDetailModalProps> = ({
  selectedRow, onClose, filteredRolls,
  agingFilter, setAgingFilter, onRollClick,
  importQty, setImportQty, importQuick, setImportQuick,
  importing, onImportGoods, importedBatch,
  showImportForm, setShowImportForm,
  onDeleteProductGroup, onExportExcel
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900">{selectedRow.productName || 'Sản phẩm chưa xác định'}</h2>
            <p className="text-sm text-slate-500 font-mono mt-1">XƯỞNG: {selectedRow.supplier || '—'} | SUB-SKU: {selectedRow.subSku || '—'}</p>
          </div>
          <div className="flex items-center gap-2">
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

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-indigo-500 shadow-sm">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Tổng tồn thực tế</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{(selectedRow as any).tonThucTe || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
            </Card>
            <Card className="p-4 border-l-4 border-emerald-500 shadow-sm">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Tồn khả dụng</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{(selectedRow as any).tonKhaDung || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
            </Card>
            <Card className="p-4 border-l-4 border-amber-500 shadow-sm">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Đã giữ đơn</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{(selectedRow as any).daGiuDon || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
            </Card>
            <Card className="p-4 border-l-4 border-rose-500 shadow-sm">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Lỗi / Hỏng</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{((selectedRow as any).loi || 0) + ((selectedRow as any).hong || 0)} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
            </Card>
          </div>

          {/* Rolls Table with Aging Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                Danh sách Cuộn vật lý ({filteredRolls.length})
              </h3>
              
              {/* Aging Filter Pills & Export */}
              <div className="flex items-center gap-4">
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
                
                <button 
                  onClick={onExportExcel}
                  disabled={filteredRolls.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-bold transition-colors border border-emerald-200"
                >
                  <Download className="w-4 h-4" />
                  Tải Excel
                </button>
              </div>
            </div>
            <InventoryRollsTable filteredRolls={filteredRolls} handleShowDetail={(r) => {
              if (onRollClick) onRollClick(r);
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
