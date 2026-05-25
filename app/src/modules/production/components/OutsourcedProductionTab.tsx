import React, { useState } from 'react';
import { Search, Clock, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatDate } from '../../../utils/format';
import BatchDetailPanel from '../../inventory/components/BatchDetailPanel';
import { useManualImport } from '../../inventory/hooks/useManualImport';

const OutsourcedProductionTab: React.FC = () => {
  const h = useManualImport();
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc batch theo search và logic pending/quick-import
  const filteredBatches = h.batches.filter(b => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = (
      (b.sku || '').toLowerCase().includes(s) ||
      (b.productName || '').toLowerCase().includes(s) ||
      (b.subSku || '').toLowerCase().includes(s) ||
      (b.supplier || '').toLowerCase().includes(s)
    );

    if (!matchesSearch) return false;

    // Ẩn nếu đã mark done (in nhãn xong)
    if (b.note && b.note.includes('[PRINTED]')) return false;

    const stats = h.getBatchStatusSummary(b);
    const hasPending = stats.pending > 0;
    
    // Quick import (nhập nhanh qua form hoặc excel) không yêu cầu scan
    // Ta giả định nếu không có pending nhưng inStock > 0 thì là đã hoàn thành hoặc nhập nhanh
    if (hasPending) return true;

    // Nếu không có pending, kiểm tra xem có phải mới tạo trong vòng 3 ngày không (để in tem)
    const createdAt = new Date(b.createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const isRecent = createdAt > threeDaysAgo;

    if (isRecent) return true;

    return false;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Cột trái: Danh sách các lô hàng sản xuất ngoài */}
      <Card className="w-full lg:w-1/3 flex flex-col h-[calc(100vh-200px)] border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm tên SP, SKU, Xưởng..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">Hiển thị các lô hàng mua ngoài cần in tem / scan mã nhập kho.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/30">
          {filteredBatches.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-sm">
              Không có lô hàng nào cần xử lý.
            </div>
          ) : (
            filteredBatches.map(b => {
              const stats = h.getBatchStatusSummary(b);
              const isActive = h.activeBatch?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => h.fetchBatchDetail(b.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {b.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(b.createdAt)}</span>
                  </div>
                  <h4 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {b.productName}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" /> Chờ scan: {stats.pending}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3 h-3" /> Đã nhập: {stats.inStock}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Cột phải: Chi tiết lô hàng và bảng Scan */}
      <div className="w-full lg:w-2/3 flex flex-col h-[calc(100vh-200px)]">
        <BatchDetailPanel
          activeBatch={h.activeBatch}
          getBatchStatusSummary={h.getBatchStatusSummary}
          onScan={h.handleScanManual}
          onMarkDone={h.handleMarkBatchDone}
        />
      </div>
    </div>
  );
};

export default OutsourcedProductionTab;
