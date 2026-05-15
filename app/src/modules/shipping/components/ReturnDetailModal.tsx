import React, { useState } from 'react';
import { TruckIcon } from 'lucide-react';
import api from '../../../services/api';

const RESOLUTION_LABELS: Record<string, string> = {
  refund: '💰 Hoàn tiền',
  reship: '🚚 Giao lại',
  exchange: '🔄 Đổi hàng',
  cancel: '❌ Hủy đơn',
};

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

interface ReturnDetailModalProps {
  showResolve: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnDetailModal({ showResolve, onClose, onSuccess }: ReturnDetailModalProps) {
  const [resolution, setResolution] = useState('refund');
  const [refundAmount, setRefundAmount] = useState(showResolve.order.totalRevenue || 0);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [refundNote, setRefundNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/returns/${showResolve.id}/resolve`, {
        resolution,
        refundAmount: resolution === 'refund' ? refundAmount : 0,
        refundMethod: resolution === 'refund' ? refundMethod : undefined,
        refundNote: refundNote || undefined,
      });
      onSuccess();
    } catch (e: any) { 
      alert(e.message || 'Lỗi'); 
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Giải quyết {showResolve.code}</h2>
        <p className="text-sm text-gray-500">
          Đơn: {showResolve.order.code} — {showResolve.order.customerName}
          <br />Tổng đơn: <b>{fmt(showResolve.order.totalRevenue || 0)}đ</b>
        </p>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-2 block">Phương án</label>
          <div className="grid grid-cols-2 gap-2">
            {(['refund', 'reship', 'exchange', 'cancel'] as const).map(r => (
              <button key={r} onClick={() => setResolution(r)}
                className={`px-3 py-2.5 text-xs font-bold rounded-lg border transition-all ${resolution === r ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {RESOLUTION_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {resolution === 'refund' && (
          <div className="space-y-3 p-3 bg-cyan-50 rounded-lg">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Số tiền hoàn</label>
              <input type="number" value={refundAmount || ''} onChange={e => setRefundAmount(Number(e.target.value))}
                max={showResolve.order.totalRevenue || 0}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-right font-bold" />
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setRefundAmount(showResolve.order.totalRevenue || 0)}
                  className="text-[10px] font-bold px-2 py-1 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200">
                  Hoàn 100% ({fmt(showResolve.order.totalRevenue || 0)}đ)
                </button>
                <button type="button" onClick={() => setRefundAmount(Math.round((showResolve.order.totalRevenue || 0) / 2))}
                  className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Hoàn 50%</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Phương thức hoàn</label>
              <div className="flex gap-2">
                {[{ v: 'cash', l: 'Tiền mặt' }, { v: 'bank_transfer', l: 'CK' }, { v: 'credit', l: 'Ghi có' }].map(m => (
                  <button key={m.v} onClick={() => setRefundMethod(m.v)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${refundMethod === m.v ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-500'}`}>
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {resolution === 'reship' && (
          <div className="p-3 bg-purple-50 rounded-lg flex items-center gap-3">
            <TruckIcon size={20} className="text-purple-500" />
            <p className="text-sm text-purple-700">Hệ thống sẽ tạo đơn hàng mới từ đơn gốc {showResolve.order.code} với tổng tiền = 0đ (giao lại miễn phí).</p>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú</label>
          <textarea value={refundNote} onChange={e => setRefundNote(e.target.value)} rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleResolve} disabled={actionLoading}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50">
            {actionLoading ? 'Đang xử lý...' : 'Xác nhận giải quyết'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Hủy</button>
        </div>
      </div>
    </div>
  );
}
