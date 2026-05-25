/**
 * BatchDetailPanel — Displays selected batch info, QR grid, and scan panel
 */

import React from 'react';
import { QrCode, Package, CheckCircle2, Clock, FileText, User, Printer } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatDate } from '../../../utils/format';
import { ImportBatch } from '../types';

import { inventoryService } from '../services/inventory.service';
import { printBatchQRs } from '../../../utils/printQR';
import ScanToStockPanel from '../../production/components/ScanToStockPanel';

interface Props {
  activeBatch: ImportBatch | null;
  getBatchStatusSummary: (batch: ImportBatch) => { inStock: number; pending: number; defective: number; total: number };
  onScan?: (code: string, quality: 'new' | 'loi' | 'hong') => Promise<boolean>;
  onMarkDone?: (batchId: string) => void;
}

const BatchDetailPanel: React.FC<Props> = ({ activeBatch, getBatchStatusSummary, onScan, onMarkDone }) => {
  if (!activeBatch) {
    return (
      <Card className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/30">
        <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h4 className="text-lg font-bold text-slate-400">Chọn hoặc tạo lô nhập</h4>
        <p className="text-sm text-slate-400 mt-1">Chọn một lô từ danh sách bên trái hoặc tạo lô mới để bắt đầu</p>
      </Card>
    );
  }

  const s = getBatchStatusSummary(activeBatch);

  return (
    <Card className="overflow-hidden border shadow-sm border-violet-200">
      {/* Batch Info Header */}
      <div className="p-5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Lô nhập hàng</p>
            <p className="text-xl font-black text-slate-900 mt-1">{activeBatch.productName}</p>
            {activeBatch.specification && activeBatch.specification !== activeBatch.productName && (
              <p className="text-sm text-slate-500 mt-0.5">{activeBatch.specification}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div>
              <p className="font-mono text-xs text-slate-500">{activeBatch.id.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(activeBatch.createdAt)}</p>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const fullBatch = await inventoryService.getImportBatch(activeBatch.id);
                  if (fullBatch.rolls && fullBatch.rolls.length > 0) {
                    printBatchQRs(fullBatch.rolls, fullBatch.productName, fullBatch.specification, fullBatch.id);
                  } else {
                    alert('Lô hàng này chưa có mã QR nào để in.');
                  }
                } catch (err) {
                  alert('Không thể tải dữ liệu lô hàng.');
                }
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> In mã QR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Tổng', value: s.total, color: 'slate', icon: Package },
            { label: 'Đã nhập kho', value: s.inStock, color: 'green', icon: CheckCircle2 },
            { label: 'Chờ scan', value: s.pending, color: 'amber', icon: Clock },
            { label: 'Lỗi/Hỏng', value: s.defective, color: 'red', icon: FileText },
          ].map((stat, i) => (
            <div key={i} className="text-center p-2.5 bg-white rounded-xl border border-slate-100">
              <stat.icon className={`w-4 h-4 text-${stat.color}-500 mx-auto mb-1`} />
              <p className={`text-xl font-black text-${stat.color}-600`}>{stat.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>

        {activeBatch.supplier && (
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
            <User className="w-3.5 h-3.5" /><span>NCC: <strong>{activeBatch.supplier}</strong></span>
          </div>
        )}

        {/* Detail info */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {activeBatch.sku && <div className="flex gap-1"><span className="text-slate-400">SKU:</span><span className="text-slate-700 font-mono font-medium">{activeBatch.sku}</span></div>}
          {activeBatch.subSku && <div className="flex gap-1"><span className="text-slate-400">SUB-SKU:</span><span className="text-slate-700 font-mono font-medium">{activeBatch.subSku}</span></div>}
          {activeBatch.color && <div className="flex gap-1"><span className="text-slate-400">Màu sắc:</span><span className="text-slate-700">{activeBatch.color}</span></div>}
          {activeBatch.otherSpecs && <div className="flex gap-1"><span className="text-slate-400">Khác:</span><span className="text-slate-700">{activeBatch.otherSpecs}</span></div>}
          {activeBatch.note && <div className="flex gap-1 col-span-2"><span className="text-slate-400">Ghi chú:</span><span className="text-slate-700">{activeBatch.note}</span></div>}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Scanning Panel */}
        {onScan && (
          <ScanToStockPanel 
            totalItems={s.total}
            scannedItems={s.inStock}
            onScan={onScan}
            isComplete={s.pending === 0}
            onComplete={() => onMarkDone && onMarkDone(activeBatch.id)}
          />
        )}

        {/* Action Button for Admins (when onScan is not provided) */}
        {!onScan && onMarkDone && s.pending > 0 && (
          <div className="flex justify-end">
            <button onClick={() => onMarkDone(activeBatch.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">
              Chốt Lô Hàng
            </button>
          </div>
        )}

        {/* QR List Grid */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-slate-400" /> Danh sách mã QR 
            <span className="text-xs font-normal text-slate-500">({activeBatch.rolls?.length || 0} cuộn)</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {(activeBatch.rolls || []).map(roll => {
              const isPending = roll.status === 'cho_nhap_kho';
              const isDefective = roll.status === 'loi' || roll.status === 'hong';
              const isInStock = !isPending && !isDefective;
              
              return (
                <div key={roll.id} className={`p-2.5 border rounded-lg flex items-center justify-between ${
                  isPending ? 'border-slate-200 bg-white' : 
                  isDefective ? 'border-red-200 bg-red-50' : 
                  'border-green-200 bg-green-50'
                }`}>
                  <div>
                    <p className="font-mono text-[11px] font-bold text-slate-800">{roll.qrCode}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{roll.code}</p>
                  </div>
                  {isInStock ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                   isDefective ? <FileText className="w-4 h-4 text-red-500" /> : 
                   <Clock className="w-4 h-4 text-slate-300" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BatchDetailPanel;