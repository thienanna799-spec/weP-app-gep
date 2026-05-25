import React from 'react';
import { QrCode, MapPin, History, ArrowRightLeft, ClipboardCheck } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { ProductRoll, RollStatus } from '../types';
import { formatDateTime } from '../../../utils/format';

import { QRCodeSVG } from 'qrcode.react';

// Help Lucide finding missing icons
const Users = (props: any) => <ClipboardCheck {...props} />;

interface RollDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  roll: ProductRoll | null;
  onTransfer: () => void;
}

const getStatusBadge = (status: RollStatus) => {
  switch (status) {
    case 'trong_kho': return <Badge variant="green">Trong kho</Badge>;
    case 'da_giu_cho_don': return <Badge variant="blue">Đã giữ</Badge>;
    case 'da_xuat_kho': return <Badge variant="gray">Đã xuất</Badge>;
    case 'loi_hong': return <Badge variant="red">Lỗi/Hỏng</Badge>;
    case 'dang_san_xuat': return <Badge variant="yellow">Đang SX</Badge>;
    case 'hoan_tra': return <Badge variant="purple">Hoàn trả</Badge>;
    default: return <Badge variant="gray">{status}</Badge>;
  }
};

const RollDetailModal: React.FC<RollDetailModalProps> = ({ isOpen, onClose, roll, onTransfer }) => {
  if (!roll) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết cuộn: ${roll.code}`}
      size="lg"
    >
      <div className="space-y-8">
        {/* Header Info */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 h-48 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-200 shadow-sm p-4">
            <div className="text-center w-full flex flex-col items-center">
              <QRCodeSVG value={roll.qrCode} size={130} />
              <p className="text-[10px] font-mono text-slate-500 mt-3 break-all">{roll.qrCode}</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm</label>
              <p className="font-bold text-slate-900">{roll.productName}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Quy cách</label>
              <p className="font-bold text-slate-900">{roll.specification}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vị trí hiện tại</label>
              <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                <MapPin className="w-3 h-3" />
                <span>{roll.positionWarehouse || 'N/A'} / {roll.positionArea || 'N/A'} / Kệ {roll.positionShelf || 'N/A'} / Tầng {roll.positionLayer || 'N/A'} / Ô {roll.positionSlot || 'N/A'}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</label>
              <div>{getStatusBadge(roll.status)}</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Thông số kỹ thuật</label>
              <p className="text-sm font-mono">{roll.length}m - {roll.weight}kg</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Lệnh sản xuất</label>
              <p className="text-sm font-bold text-blue-600 underline">#{roll.productionOrderId}</p>
            </div>
            {roll.orderId && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Đơn hàng (Reserved)</label>
                <p className="text-sm font-bold text-purple-600 underline">#{(roll as any).order?.code || roll.orderId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Scan History / Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <History className="w-4 h-4 text-slate-600" />
            <h4 className="font-bold text-slate-900">Lịch sử di chuyển & Thao tác</h4>
          </div>
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {roll.scanHistory.map((log, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1 w-[22px] h-[22px] rounded-full bg-white border-4 border-blue-500 shadow-sm" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-slate-900 text-sm">{log.action}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Người thực hiện: <span className="font-medium">{log.operator}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" className="gap-2 text-slate-600">
            <History className="w-4 h-4" />
            <span>Xem nhật ký đầy đủ</span>
          </Button>
          <Button onClick={onTransfer} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Chuyển vị trí</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RollDetailModal;