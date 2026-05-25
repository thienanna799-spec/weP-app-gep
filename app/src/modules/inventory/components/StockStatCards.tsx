import React, { useState, useEffect } from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { inventoryService } from '../services/inventory.service';
import { StockRow } from '../hooks/useStockSummary';

interface StockStatCardsProps {
  selectedRow: StockRow;
}

export const StockStatCards: React.FC<StockStatCardsProps> = ({ selectedRow }) => {
  const [isEditingMinStock, setIsEditingMinStock] = useState(false);
  const [newMinStock, setNewMinStock] = useState<string>('');
  const [updatingMinStock, setUpdatingMinStock] = useState(false);

  useEffect(() => {
    if (selectedRow) {
      setNewMinStock(String(selectedRow.minStock || 0));
    }
  }, [selectedRow]);

  const handleUpdateMinStock = async () => {
    const val = parseFloat(newMinStock);
    if (isNaN(val)) return;
    
    setUpdatingMinStock(true);
    try {
      await inventoryService.updateMinStock(selectedRow.subSku, val);
      selectedRow.minStock = val;
      setIsEditingMinStock(false);
    } catch (err: any) {
      alert('Lỗi cập nhật mức cảnh báo: ' + (err.message || err));
    } finally {
      setUpdatingMinStock(false);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      <Card className="p-4 border-l-4 border-indigo-500 shadow-sm">
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Tổng tồn thực tế</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{(selectedRow as any).tonThucTe || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
      </Card>
      <Card className={`p-4 border-l-4 shadow-sm transition-all duration-500 ${
        selectedRow.minStock > 0 && selectedRow.tonKhaDung <= selectedRow.minStock
          ? 'border-rose-600 bg-rose-50 animate-pulse-subtle'
          : 'border-emerald-500'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
            selectedRow.minStock > 0 && selectedRow.tonKhaDung <= selectedRow.minStock
              ? 'text-rose-600'
              : 'text-emerald-500'
          }`}>Tồn khả dụng</p>
          {selectedRow.minStock > 0 && selectedRow.tonKhaDung <= selectedRow.minStock && (
            <AlertTriangle className="w-3 h-3 text-rose-600 animate-bounce" />
          )}
        </div>
        <p className="text-2xl font-black text-slate-900">{(selectedRow as any).tonKhaDung || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
        
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          {isEditingMinStock ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="number"
                value={newMinStock}
                onChange={(e) => setNewMinStock(e.target.value)}
                className="w-16 px-1.5 py-0.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              <button 
                onClick={handleUpdateMinStock}
                disabled={updatingMinStock}
                className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {updatingMinStock ? '...' : 'Lưu'}
              </button>
              <button 
                onClick={() => setIsEditingMinStock(false)}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold px-1"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-slate-400 font-medium">Cảnh báo khi &lt; {selectedRow.minStock || 0}</span>
              <button 
                onClick={() => setIsEditingMinStock(true)}
                className="text-indigo-500 hover:text-indigo-700 p-0.5 rounded-md hover:bg-indigo-50 transition-colors"
                title="Cài đặt mức cảnh báo"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </Card>
      <Card className="p-4 border-l-4 border-amber-500 shadow-sm">
        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Đã giữ đơn</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{(selectedRow as any).daGiuDon || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
      </Card>
      <Card className="p-4 border-l-4 border-amber-500 shadow-sm">
        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Lỗi (có thể dùng)</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{(selectedRow as any).loi || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
      </Card>
      <Card className="p-4 border-l-4 border-rose-500 shadow-sm">
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Hỏng (không dùng đc)</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{(selectedRow as any).hong || 0} <span className="text-sm font-normal text-slate-500">cuộn</span></p>
      </Card>
    </div>
  );
};
