/**
 * InlineInvoiceReview — Invoice review section within the order approval flow
 * ─────────────────────────────────────────────────────────────────────────────
 * Extracted from OrderDetailModal for readability. Renders the delivery receipt
 * preview, totals, and Telegram send controls used in the 2-step approval process.
 */

import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { InvoiceData, invoiceService } from '../services/invoice.service';
import { formatCurrency } from '../../../utils/format';

interface InlineInvoiceReviewProps {
  invoiceData: InvoiceData | null;
  invoiceLoading: boolean;
  orderId: string;
}

const InlineInvoiceReview: React.FC<InlineInvoiceReviewProps> = ({
  invoiceData, invoiceLoading, orderId
}) => {
  const [tgLoading, setTgLoading] = useState(false);
  const [tgChatId, setTgChatId] = useState(invoiceData?.telegramChatId || '');
  const [tgResult, setTgResult] = useState<'success' | 'error' | null>(null);

  if (invoiceLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="py-12 text-center text-sm text-slate-400 italic">
        Không tải được dữ liệu hóa đơn
      </div>
    );
  }

  const handleSendTelegram = async () => {
    setTgLoading(true);
    setTgResult(null);
    try {
      await invoiceService.sendViaTelegram(orderId, tgChatId || undefined);
      setTgResult('success');
    } catch {
      setTgResult('error');
    } finally {
      setTgLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <b>Bước 1:</b> Xem và gửi hóa đơn cho khách hàng (tải PDF, in, hoặc gửi Telegram).{' '}
          <b>Bước 2:</b> Nhấn "Xác nhận duyệt" bên dưới.
        </p>
      </div>

      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-slate-900">DELIVERY RECEIPT</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">{invoiceData.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">
            <span className="font-bold text-slate-400">Date:</span> {invoiceData.invoiceDate}
          </p>
        </div>
      </div>

      {/* Company + Customer */}
      <div className="flex justify-between items-start gap-6">
        <div className="w-[55%] flex items-center pl-24">
          <img
            src="https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw"
            alt="GEP"
            className="w-full h-32 object-contain object-left"
            onError={(e: any) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="w-[45%] bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Customer</p>
          <p className="text-sm font-bold text-slate-900">{invoiceData.customerName}</p>
          <p className="text-xs text-slate-500 mt-1">{invoiceData.customerAddress}</p>
          <p className="text-xs text-slate-500 font-mono">{invoiceData.customerPhone}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
              <th className="px-3 py-2.5 text-center w-10">#</th>
              <th className="px-3 py-2.5">Sản phẩm</th>
              <th className="px-3 py-2.5 text-center w-16">SL</th>
              <th className="px-3 py-2.5 text-right w-24">Đơn giá</th>
              <th className="px-3 py-2.5 text-right w-24">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoiceData.items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-3 py-2 text-center text-xs text-slate-400">{item.no}</td>
                <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.sku || item.productName}</td>
                <td className="px-3 py-2 text-center text-sm">{item.quantity}</td>
                <td className="px-3 py-2 text-right text-xs font-mono text-slate-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-3 py-2 text-right text-sm font-bold text-slate-800">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tạm tính</span>
            <span className="font-mono text-slate-700">{formatCurrency(invoiceData.subtotal)}</span>
          </div>
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex justify-between text-base pt-1">
            <span className="font-bold text-slate-800">Tổng cộng</span>
            <span className="font-black text-blue-700 font-mono">{formatCurrency(invoiceData.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Telegram Send */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-blue-900">Gửi qua Telegram</h4>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Chat ID (để trống = mặc định)"
            value={tgChatId}
            onChange={e => setTgChatId(e.target.value)}
            className="flex-1 h-9 px-3 text-sm bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          />
          <Button
            onClick={handleSendTelegram}
            disabled={tgLoading}
            className="gap-1.5 bg-blue-600 h-9 px-4"
          >
            {tgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gửi
          </Button>
        </div>
        {tgResult === 'success' && (
          <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã gửi thành công!
          </div>
        )}
        {tgResult === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
            <AlertCircle className="w-3.5 h-3.5" /> Gửi thất bại.
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineInvoiceReview;
