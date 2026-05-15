import React, { useState } from 'react';
import api from '../../../services/api';

interface CreateReturnFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReturnForm({ onClose, onSuccess }: CreateReturnFormProps) {
  const [createOrderCode, setCreateOrderCode] = useState('');
  const [createType, setCreateType] = useState('failed_delivery');
  const [createReason, setCreateReason] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const searchOrders = async (term: string) => {
    setCreateOrderCode(term);
    if (term.length < 3) { setSearchResults([]); return; }
    try {
      const orders = await api.get<any[]>(`/orders?search=${encodeURIComponent(term)}&limit=5`);
      setSearchResults(orders || []);
    } catch { setSearchResults([]); }
  };

  const handleCreate = async () => {
    if (!selectedOrderId || !createReason.trim()) return;
    setActionLoading(true);
    try {
      await api.post('/returns', {
        orderId: selectedOrderId,
        type: createType,
        reason: createReason,
      });
      onSuccess();
    } catch (e: any) { 
      alert(e.message || 'Lỗi tạo RTN'); 
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Tạo yêu cầu hoàn trả</h2>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Tìm đơn hàng *</label>
          <input value={createOrderCode} onChange={e => searchOrders(e.target.value)}
            placeholder="Nhập mã đơn (VD: ORD-123456)"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500" />
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg mt-1 max-h-32 overflow-y-auto">
              {searchResults.map((o: any) => (
                <button key={o.id} onClick={() => { setSelectedOrderId(o.id); setCreateOrderCode(o.code); setSearchResults([]); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex justify-between ${selectedOrderId === o.id ? 'bg-indigo-50' : ''}`}>
                  <span className="font-mono font-bold">{o.code}</span>
                  <span className="text-gray-500">{o.customerName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại</label>
          <select value={createType} onChange={e => setCreateType(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="failed_delivery">Giao hàng thất bại</option>
            <option value="customer_return">Khách hàng trả hàng</option>
            <option value="damaged">Hàng bị hỏng</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Lý do *</label>
          <textarea value={createReason} onChange={e => setCreateReason(e.target.value)} rows={3}
            placeholder="Mô tả lý do hoàn trả..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-indigo-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleCreate} disabled={actionLoading || !selectedOrderId}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
            {actionLoading ? 'Đang xử lý...' : 'Tạo yêu cầu'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Hủy</button>
        </div>
      </div>
    </div>
  );
}
