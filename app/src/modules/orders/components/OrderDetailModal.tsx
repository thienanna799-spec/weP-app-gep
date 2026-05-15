import React, { useState, useEffect } from 'react';
import { Camera, X, Download, Printer, Send, Loader2, AlertCircle, ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { Order, OrderItem, OrderLog, OrderStatus, OrderPriority } from '../../../types/order.types';
import { formatDateTime } from '../../../utils/format';
import api from '../../../services/api';
import { invoiceService, InvoiceData } from '../services/invoice.service';
import OrderSummary from './OrderSummary';
import OrderItemsTable from './OrderItemsTable';
import OrderLogsTimeline from './OrderLogsTimeline';
import InlineInvoiceReview from './InlineInvoiceReview';

interface DeliveryProof {
  id: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  items: OrderItem[];
  logs: OrderLog[];
  isAdmin: boolean;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onInvoice: () => void;
}

export const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'nhap': return <Badge variant="gray">Nháp</Badge>;
    case 'cho_duyet': return <Badge variant="yellow">Chờ duyệt</Badge>;
    case 'da_duyet': return <Badge variant="green">Đã duyệt</Badge>;
    case 'tu_choi': return <Badge variant="red">Từ chối</Badge>;
    case 'dang_chuan_bi': return <Badge variant="blue">Chuẩn bị hàng</Badge>;
    case 'cho_xuat_kho': return <Badge variant="blue">Chờ xuất kho</Badge>;
    case 'dang_giao': return <Badge variant="orange">Đang giao</Badge>;
    case 'hoan_thanh': return <Badge variant="green" className="bg-green-600 text-white">Hoàn thành</Badge>;
    case 'huy': return <Badge variant="red" className="bg-red-600 text-white">Đã hủy</Badge>;
    default: return <Badge variant="gray">{status}</Badge>;
  }
};

export const getPriorityBadge = (priority: OrderPriority) => {
  switch (priority) {
    case 'thap': return <Badge variant="gray" className="bg-slate-100 text-slate-500 border-none">Thấp</Badge>;
    case 'trung_binh': return <Badge variant="blue" className="bg-blue-50 text-blue-500 border-none">Trung bình</Badge>;
    case 'cao': return <Badge variant="orange" className="bg-orange-50 text-orange-500 border-none font-bold italic">Cao</Badge>;
    case 'khan_cap': return <Badge variant="red" className="bg-rose-100 text-rose-600 border-none font-black animate-pulse">Khẩn cấp</Badge>;
    default: return <Badge variant="gray">{priority}</Badge>;
  }
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen, onClose, order, items, logs, isAdmin,
  onApprove, onReject, onCancel, onInvoice
}) => {
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Inline invoice state for 2-step approval
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      api.get<DeliveryProof[]>(`/orders/${order.id}/delivery-proofs`)
        .then(setProofs)
        .catch(() => setProofs([]));
    } else {
      setProofs([]);
      setShowInvoice(false);
    }
  }, [isOpen, order?.id]);

  const handleStartApprove = () => {
    if (!order) return;
    setShowInvoice(true);
    setInvoiceLoading(true);
    invoiceService.getData(order.id)
      .then(d => setInvoiceData(d))
      .catch(() => setInvoiceData(null))
      .finally(() => setInvoiceLoading(false));
  };

  const handleConfirmApprove = async () => {
    setApproveLoading(true);
    try { onApprove(); } finally { setApproveLoading(false); }
  };

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết đơn hàng: #${order.code}`}
      size="lg"
      footer={
        showInvoice ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="gap-1.5" onClick={() => invoiceService.printInvoice(order.id)}><Printer className="w-4 h-4" />In</Button>
              <Button className="gap-1.5 bg-blue-600" disabled={dlLoading} onClick={async () => { setDlLoading(true); try { await invoiceService.downloadPDF(order.id, order.code); } finally { setDlLoading(false); } }}>
                {dlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Tải PDF
              </Button>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setShowInvoice(false)} className="gap-1.5"><ArrowLeft className="w-4 h-4" />Quay lại</Button>
              <div className="flex-1" />
              <Button onClick={handleConfirmApprove} disabled={approveLoading} className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 font-black px-6">
                {approveLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}Xác nhận duyệt đơn hàng
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {isAdmin && order.status === 'cho_duyet' && (
                <>
                  <Button variant="secondary" className="bg-red-50 text-red-600 border-red-200" onClick={onReject}>Từ chối đơn</Button>
                  <Button className="bg-green-600 shadow-md shadow-green-100" onClick={handleStartApprove}>Kiểm tra đơn hàng</Button>
                </>
              )}
              {order.status !== 'hoan_thanh' && order.status !== 'huy' && (
                <Button variant="secondary" className="border-slate-200" onClick={onCancel}>Hủy đơn</Button>
              )}
              {order.status !== 'cho_duyet' && (
                <Button variant="secondary" className="gap-1.5 border-blue-200 text-blue-700 bg-blue-50" onClick={onInvoice}>
                  <FileText className="w-4 h-4" />Xuất hóa đơn
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
          </div>
        )
      }
    >
      {showInvoice ? (
        <div className="max-h-[70vh] overflow-y-auto px-1">
          <InlineInvoiceReview
            invoiceData={invoiceData}
            invoiceLoading={invoiceLoading}
            orderId={order.id}
          />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
        {/* Order Info */}
        <div className="md:col-span-7 space-y-6">
          <OrderSummary order={order} />
          <OrderItemsTable order={order} items={items} />

          {/* Delivery Proof Photos */}
          {proofs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Camera className="w-4 h-4 text-green-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase">Chứng từ giao hàng</h3>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {proofs.length} file
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {proofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setPreviewUrl(proof.fileUrl)}
                  >
                    {proof.fileType === 'image' ? (
                      <img src={proof.fileUrl} alt={proof.fileName} className="w-full h-24 object-cover" />
                    ) : (
                      <video src={proof.fileUrl} className="w-full h-24 object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                      <p className="text-white text-[9px] font-bold truncate">{proof.uploadedBy} · {formatDateTime(proof.createdAt)}</p>
                    </div>
                    <div className="absolute top-1 left-1">
                      <span className={`px-1 py-0.5 text-[8px] font-bold rounded-full ${
                        proof.fileType === 'video' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {proof.fileType === 'video' ? '🎥' : '📷'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline & Progress */}
        <div className="md:col-span-5 space-y-6">
          <OrderLogsTimeline logs={logs} />
        </div>
      </div>
      )}

      {/* Full-screen Preview */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {previewUrl.startsWith('data:video') ? (
            <video src={previewUrl} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </Modal>
  );
};

export default OrderDetailModal;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          /**
 * ReturnsConstants — Types, labels, and formatters for the Returns module
 * ─────────────────────────────────────────────────────────────────────────
 * Extracted from ReturnsTab for reuse across ReturnsTab & ReturnDetailModal.
 */

export interface ReturnRequest {
  id: string;
  code: string;
  orderId: string;
  type: string;
  reason: string;
  status: string;
  resolution: string | null;
  refundAmount: number;
  refundMethod: string | null;
  refundedAt: string | null;
  reshipOrderId: string | null;
  createdByName: string;
  processedByName: string | null;
  createdAt: string;
  resolvedAt: string | null;
  order: {
    code: string;
    customerName: string;
    customerPhone: string;
    totalRevenue: number | null;
    status: string;
    customer: { telegramChatId: string | null } | null;
  };
}

export interface ReturnStats {
  total: number; pending: number; approved: number;
  processing: number; resolved: number; rejected: number;
  totalRefundAmount: number;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  processing: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  rejected: 'Từ chối',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const TYPE_LABELS: Record<string, string> = {
  failed_delivery: 'Giao thất bại',
  customer_return: 'KH trả hàng',
  damaged: 'Hàng hỏng',
};

export const RESOLUTION_LABELS: Record<string, string> = {
  refund: '💰 Hoàn tiền',
  reship: '🚚 Giao lại',
  exchange: '🔄 Đổi hàng',
  cancel: '❌ Hủy đơn',
};

export const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  