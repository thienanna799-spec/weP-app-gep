/**
 * InvoicePreview Component
 * ─────────────────────────────────────────────────────────
 * A rich modal that renders the invoice inline, with buttons to
 * download PDF, print, and send via Telegram.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Send,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { invoiceService, InvoiceData } from '../services/invoice.service';
import { Order } from '../../../types/order.types';

interface InvoicePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ isOpen, onClose, order }) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramResult, setTelegramResult] = useState<'success' | 'error' | null>(null);
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      setLoading(true);
      setTelegramResult(null);
      invoiceService.getData(order.id)
        .then(data => {
          setInvoiceData(data);
          if (data.telegramChatId) {
            setTelegramChatId(data.telegramChatId);
          } else {
            setTelegramChatId('');
          }
        })
        .catch(err => console.error('Failed to load invoice data:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, order]);

  if (!order) return null;

  const formatVND = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    try {
      await invoiceService.downloadPDF(order.id, order.code);
    } catch (err) {
      alert('Lỗi tải PDF. Vui lòng thử lại.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handlePrint = () => {
    invoiceService.printInvoice(order.id);
  };

  const handleOpenPreview = () => {
    const url = invoiceService.getPreviewUrl(order.id);
    window.open(url, '_blank');
  };

  const handleSendTelegram = async () => {
    setTelegramLoading(true);
    setTelegramResult(null);
    try {
      await invoiceService.sendViaTelegram(order.id, telegramChatId || undefined);
      setTelegramResult('success');
    } catch (err) {
      setTelegramResult('error');
    } finally {
      setTelegramLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      'dang_giao': { label: 'Đang giao', color: '#92400e', bg: '#fef3c7' },
      'giao_thanh_cong': { label: 'Đã giao', color: '#065f46', bg: '#d1fae5' },
      'cho_xuat_kho': { label: 'Chờ xuất kho', color: '#3730a3', bg: '#e0e7ff' },
      'dang_chuan_bi': { label: 'Chuẩn bị', color: '#1e40af', bg: '#dbeafe' },
      'da_xuat_kho': { label: 'Đã xuất', color: '#6d28d9', bg: '#ede9fe' },
    };
    return map[status] || { label: status, color: '#4a5568', bg: '#f7fafc' };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Biên bản giao hàng"
      size="lg"
      footer={
        <div className="flex flex-wrap gap-2 w-full">
          <Button
            variant="secondary"
            onClick={handleOpenPreview}
            className="gap-1.5 border-slate-200"
          >
            <ExternalLink className="w-4 h-4" />
            Xem HTML
          </Button>
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="gap-1.5 border-slate-200"
          >
            <Printer className="w-4 h-4" />
            In
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloadLoading}
            className="gap-1.5 bg-blue-600 shadow-md shadow-blue-100"
          >
            {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tải PDF
          </Button>
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : invoiceData ? (
        <div className="space-y-4">
          {/* ── Invoice Header ──────────────────────────── */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">DELIVERY RECEIPT</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">{invoiceData.invoiceNumber}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-slate-500">
                <span className="font-bold text-slate-400">Date:</span> {invoiceData.invoiceDate}
              </p>
              <div
                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{
                  background: getStatusLabel(invoiceData.deliveryStatus).bg,
                  color: getStatusLabel(invoiceData.deliveryStatus).color,
                }}
              >
                {getStatusLabel(invoiceData.deliveryStatus).label}
              </div>
            </div>
          </div>

          {/* ── Company + Customer ──────────────────────── */}
          <div className="flex justify-between items-start gap-6">
            <div className="flex items-center pl-24 w-[55%]">
              <img
                src="https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw"
                alt="GEP"
                className="w-full h-32 object-contain object-left"
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="w-[45%] bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
              <p className="text-sm font-bold text-slate-900">{invoiceData.customerName}</p>
              <p className="text-xs text-slate-500 mt-1">{invoiceData.customerAddress}</p>
              <p className="text-xs text-slate-500 font-mono">{invoiceData.customerPhone}</p>
            </div>
          </div>

          {/* ── Products Table ──────────────────────────── */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-2.5 text-center w-10">#</th>
                  <th className="px-3 py-2.5">Sản phẩm</th>
                  <th className="px-3 py-2.5 text-center w-16">SL</th>
                  <th className="px-3 py-2.5 text-center w-16">ĐVT</th>
                  <th className="px-3 py-2.5 text-right w-24">Đơn giá</th>
                  <th className="px-3 py-2.5 text-right w-24">Thành tiền</th>
                  <th className="px-3 py-2.5 w-20">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceData.items.length > 0 ? (
                  invoiceData.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-2 text-center text-xs text-slate-400">{item.no}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.sku || item.productName}</td>
                      <td className="px-3 py-2 text-center text-sm">{item.quantity}</td>
                      <td className="px-3 py-2 text-center text-xs text-slate-500">{item.unit}</td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-slate-600">{formatVND(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right text-sm font-bold text-slate-800">{formatVND(item.amount)}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">{item.note || ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400 italic">
                      Chưa có sản phẩm trong đơn hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Totals ─────────────────────────────────── */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tạm tính</span>
                <span className="font-mono text-slate-700">{formatVND(invoiceData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">VAT ({invoiceData.vatPercent}%)</span>
                <span className="font-mono text-slate-700">{formatVND(invoiceData.vatAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Phí vận chuyển</span>
                <span className="font-mono text-slate-700">{formatVND(invoiceData.shippingFee)}</span>
              </div>
              <div className="h-px bg-slate-200 my-1" />
              <div className="flex justify-between text-base pt-1">
                <span className="font-bold text-slate-800">Tổng cộng</span>
                <span className="font-black text-blue-700 font-mono">{formatVND(invoiceData.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* ── Notes ──────────────────────────────────── */}
          {invoiceData.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <p className="text-xs font-bold text-amber-600 uppercase mb-1">Ghi chú</p>
              <p className="text-sm text-amber-800">{invoiceData.notes}</p>
            </div>
          )}

          {/* ── Telegram Send ──────────────────────────── */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-blue-900">Gửi qua Telegram</h4>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Chat ID (để trống = mặc định)"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="flex-1 h-9 px-3 text-sm bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
              />
              <Button
                onClick={handleSendTelegram}
                disabled={telegramLoading}
                className="gap-1.5 bg-blue-600 h-9 px-4 shadow-md shadow-blue-100"
              >
                {telegramLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Gửi
              </Button>
            </div>
            {telegramResult === 'success' && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã gửi thành công qua Telegram!
              </div>
            )}
            {telegramResult === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                Gửi thất bại. Kiểm tra Bot Token và Chat ID.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-slate-400 italic">
          Không tải được dữ liệu hóa đơn
        </div>
      )}
    </Modal>
  );
};

export default InvoicePreview;
