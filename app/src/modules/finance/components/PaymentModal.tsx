/**
 * PaymentModal — Record a payment for an order
 * Shows payment history and validates amount.
 */
import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { financeService } from '../services/finance.service';
import type { PaymentRecord } from '../services/finance.service';

interface Props {
  orderId: string;
  orderCode: string;
  customerName: string;
  totalRevenue: number;
  onClose: () => void;
  onSuccess: () => void;
}

const METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'cod', label: 'COD' },
  { value: 'cong_no', label: 'Ghi nợ' },
];

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function PaymentModal({ orderId, orderCode, customerName, totalRevenue, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remaining, setRemaining] = useState(totalRevenue);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    financeService.getOrderPayments(orderId).then(data => {
      setHistory(data.payments || []);
      setTotalPaid(data.totalPaid || 0);
      setRemaining(data.remaining || totalRevenue);
      setAmount(data.remaining || totalRevenue);
    }).catch(() => {});
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return setError('Số tiền phải > 0');
    if (amount > remaining + 1) return setError(`Số tiền vượt quá còn nợ (${fmt(remaining)}đ)`);

    setLoading(true);
    setError('');
    try {
      await financeService.createPayment({ orderId, amount, method, reference: reference || undefined, note: note || undefined });
      setSuccess('Ghi nhận thanh toán thành công!');
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (e: any) {
      setError(e?.message || 'Lỗi ghi nhận thanh toán');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" /> Ghi nhận thanh toán
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Đơn {orderCode} — {customerName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 p-5 bg-gray-50">
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng đơn</p>
            <p className="text-sm font-black text-gray-900 mt-0.5">{fmt(totalRevenue)}đ</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-green-500 uppercase">Đã trả</p>
            <p className="text-sm font-black text-green-600 mt-0.5">{fmt(totalPaid)}đ</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-red-500 uppercase">Còn nợ</p>
            <p className="text-sm font-black text-red-600 mt-0.5">{fmt(remaining)}đ</p>
          </div>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-green-600">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && <div className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg font-medium">{error}</div>}

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Số tiền thanh toán <span className="text-red-400">*</span></label>
              <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))}
                max={remaining} min={1} required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right font-bold" />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setAmount(remaining)}
                  className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Trả hết ({fmt(remaining)}đ)</button>
                {remaining > 100000 && (
                  <button type="button" onClick={() => setAmount(Math.round(remaining / 2))}
                    className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">Trả 50%</button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Phương thức</label>
              <div className="grid grid-cols-2 gap-2">
                {METHODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      method === m.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mã giao dịch / biên lai</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Tùy chọn..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Ghi chú..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-500" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
              {loading ? 'Đang xử lý...' : `Ghi nhận ${fmt(amount)}đ`}
            </button>
          </form>
        )}

        {/* Payment History */}
        {history.length > 0 && (
          <div className="border-t border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
              <Clock size={12} /> Lịch sử thanh toán ({history.length})
            </h3>
            <div className="space-y-2">
              {history.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-bold text-green-600">+{fmt(p.amount)}đ</span>
                    <span className="text-gray-400 ml-2 text-xs">{p.method}</span>
                    {p.reference && <span className="text-gray-400 ml-1 text-xs">({p.reference})</span>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(p.paidAt).toLocaleDateString('vi-VN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
