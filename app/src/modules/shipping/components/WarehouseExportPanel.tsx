/**
 * WarehouseExportPanel — QR scanning + progress for warehouse export
 * ──────────────────────────────────────────────────────────────────
 * Extracted from ShippingDetailPanel for maintainability.
 */

import React from 'react';
import { QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface WarehouseExportPanelProps {
  totalQuantity: number;
  totalRolls: number;
  items: any[];
  scanCode: string;
  setScanCode: (v: string) => void;
  scanLoading: boolean;
  scanError: string | null;
  onScanRoll: () => void;
}

const WarehouseExportPanel: React.FC<WarehouseExportPanelProps> = ({
  totalQuantity, totalRolls, items,
  scanCode, setScanCode, scanLoading, scanError, onScanRoll
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-4">
          <QrCode className="text-indigo-500" /> Soạn hàng & Xuất kho
        </h4>
        
        <div className="flex items-center gap-6 mb-6 p-4 bg-indigo-50/50 rounded-xl">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-slate-600">Tiến độ xuất kho</span>
              <span className="text-indigo-600">{totalQuantity} / {totalRolls} cuộn</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(totalQuantity / totalRolls) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <Input autoFocus placeholder="Quét mã QR cuộn thành phẩm..." value={scanCode} onChange={(e: any) => setScanCode(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && onScanRoll()} className={`flex-1 h-12 text-lg ${scanError ? 'border-red-500 focus:ring-red-500' : ''}`} />
          <Button onClick={onScanRoll} disabled={scanLoading || !scanCode} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700">
            {scanLoading ? <LoadingSpinner size="sm" /> : 'Xác nhận'}
          </Button>
        </div>
        {scanError && <p className="text-sm text-red-600 font-bold mb-4 flex items-center gap-1"><AlertCircle className="w-4 h-4"/>{scanError}</p>}

        {/* Scanned Items List */}
        {items && items.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">Cuộn đã xuất ({items.length})</p>
            <div className="grid grid-cols-2 gap-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 className="w-4 h-4"/></div>
                    <div>
                      <p className="font-bold text-slate-900">{item.qrCode}</p>
                      <p className="text-[10px] text-slate-500">{item.productName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseExportPanel;
