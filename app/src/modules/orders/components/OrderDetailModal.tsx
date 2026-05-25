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
import DeliveryProofPhotos, { DeliveryProof } from './DeliveryProofPhotos';
import FullscreenPreview from './FullscreenPreview';

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
      size="4xl"
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
        <div className="md:col-span-8 space-y-6">
          <OrderSummary order={order} />
          <OrderItemsTable order={order} items={items} />

          <DeliveryProofPhotos proofs={proofs} setPreviewUrl={setPreviewUrl} />
        </div>

        {/* Logs */}
        <div className="md:col-span-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <OrderLogsTimeline logs={logs} />
        </div>
      </div>
      )}

      <FullscreenPreview previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} />
    </Modal>
  );
};

export default OrderDetailModal;
