/**
 * InvoicePreview Component
 * ─────────────────────────────────────────────────────────
 * A rich modal that renders the invoice inline, with buttons to
 * download PDF, print, and send via Telegram.
 */

import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { invoiceService, InvoiceData } from '../services/invoice.service';
import { Order } from '../../../types/order.types';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceCustomerInfo } from './InvoiceCustomerInfo';
import { InvoiceProductTable } from './InvoiceProductTable';
import { InvoiceTotals } from './InvoiceTotals';
import { InvoiceTelegramSender } from './InvoiceTelegramSender';

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
          <InvoiceHeader invoiceData={invoiceData} getStatusLabel={getStatusLabel} />
          
          <InvoiceCustomerInfo invoiceData={invoiceData} />

          <InvoiceProductTable invoiceData={invoiceData} formatVND={formatVND} />

          <InvoiceTotals invoiceData={invoiceData} formatVND={formatVND} />

          {/* ── Notes ──────────────────────────────────── */}
          {invoiceData.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <p className="text-xs font-bold text-amber-600 uppercase mb-1">Ghi chú</p>
              <p className="text-sm text-amber-800">{invoiceData.notes}</p>
            </div>
          )}

          <InvoiceTelegramSender 
            telegramChatId={telegramChatId}
            setTelegramChatId={setTelegramChatId}
            handleSendTelegram={handleSendTelegram}
            telegramLoading={telegramLoading}
            telegramResult={telegramResult}
          />
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
