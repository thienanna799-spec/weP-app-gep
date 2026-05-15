/**
 * ProductionOrderCard — Single production order card
 * ──────────────────────────────────────────────────
 * Displays status, progress bar, roll counts, and action buttons.
 */

import React from 'react';
import { Play, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../utils/format';
import { PRODUCTION_ORDER_STATUS_DATA } from '../../../utils/constants';

interface Props {
  lsx: any;
  onStatusUpdate: (id: string, status: string) => void;
}

const ProductionOrderCard: React.FC<Props> = ({ lsx, onStatusUpdate }) => {
  const completedTime = lsx.completedAt
    ? format(new Date(lsx.completedAt), 'HH:mm dd/MM/yyyy')
    : formatDate(lsx.updatedAt);

  const goodRolls = lsx._goodRolls ?? 0;
  const defectRolls = lsx._defectRolls ?? 0;
  const remaining = Math.max(0, lsx.targetRolls - goodRolls);
  const percent = lsx.targetRolls > 0 ? Math.min(100, Math.round((goodRolls / lsx.targetRolls) * 100)) : 0;
  const isActive = lsx.status !== 'completed' && lsx.status !== 'cancelled';

  return (
    <Card
      className={`p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        lsx.status === 'completed' ? 'border-green-200 bg-green-50/20'
          : lsx.status === 'cancelled' ? 'border-red-200 bg-red-50/20 opacity-60'
          : 'border-gray-100'
      }`}
    >
      {/* Header: code + status + actions */}
      <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <div className="flex items-center gap-4">
          <span className="font-mono font-bold text-lg text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{lsx.code}</span>
          <Badge variant={(PRODUCTION_ORDER_STATUS_DATA as any)[lsx.status]?.color}>
            {(PRODUCTION_ORDER_STATUS_DATA as any)[lsx.status]?.label}
          </Badge>
        </div>
        <div className="flex gap-2 items-center">
          {lsx.status === 'completed' && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold">Done</span>
              <span className="text-[10px] text-green-600 font-medium">{completedTime}</span>
            </div>
          )}
          {lsx.status === 'cancelled' && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-600 rounded-lg border border-red-200">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-bold">Đã hủy</span>
              <span className="text-[10px] text-red-500 font-medium">{formatDate(lsx.updatedAt)}</span>
            </div>
          )}
          {lsx.status === 'waiting_material' && (
            <Button variant="secondary" className="px-4 py-1.5 text-xs font-bold" onClick={() => onStatusUpdate(lsx.id, 'ready')}>Xác nhận NL</Button>
          )}
          {lsx.status === 'ready' && (
            <Button variant="primary" className="px-4 py-1.5 text-xs font-bold gap-2" onClick={() => onStatusUpdate(lsx.id, 'producing')}>
              <Play className="w-3 h-3 fill-current" /> Bắt đầu máy
            </Button>
          )}
          {lsx.status === 'producing' && (
            <Button variant="primary" className="px-4 py-1.5 text-xs font-bold gap-2 bg-green-600 hover:bg-green-700 border-none" onClick={() => onStatusUpdate(lsx.id, 'completed')}>
              <CheckCircle className="w-3 h-3" /> Hoàn tất LSX
            </Button>
          )}
          {isActive && (
            <Button variant="ghost" className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 font-bold" onClick={() => onStatusUpdate(lsx.id, 'cancelled')}>
              <XCircle className="w-3 h-3" /> Hủy
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sản lượng cuộn (hàng tốt)</p>
          <span className={`text-xs font-bold ${percent >= 100 ? 'text-green-600' : 'text-blue-600'}`}>{percent}%</span>
        </div>
        <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden mb-3">
          <div className={`h-full transition-all duration-700 rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-white rounded-lg border border-green-100">
            <p className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Đã SX</p>
            <p className="text-lg font-black text-green-600">{goodRolls}</p>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-orange-100">
            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Chờ SX</p>
            <p className="text-lg font-black text-orange-600">{remaining}</p>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mục tiêu</p>
            <p className="text-lg font-black text-slate-700">{lsx.targetRolls}</p>
          </div>
        </div>
        {defectRolls > 0 && (
          <p className="mt-2 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-1 rounded text-center border border-red-100">
            ⚠ {defectRolls} cuộn lỗi/hỏng (không tính vào sản lượng)
          </p>
        )}
        {remaining <= 0 && isActive && (
          <p className="mt-2 text-xs text-green-700 font-bold bg-green-100 px-3 py-1.5 rounded-lg text-center">
            ✅ Đã sản xuất đủ số lượng!
          </p>
        )}
      </div>

      {/* Details */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Tiến độ
          </p>
          <p className="font-bold text-gray-800 text-sm">
            {lsx.status === 'completed' ? `✅ Hoàn thành: ${completedTime}` : `Chạy: ${formatDate(lsx.productionDate)}`}
          </p>
        </div>
        <div className="space-y-1 font-inter">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <User className="w-3 h-3" /> Phụ trách
          </p>
          <p className="font-bold text-gray-800 text-sm truncate">{lsx.personInChargeName || 'Kỹ thuật'}</p>
        </div>
        <div className="space-y-1 md:col-span-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sản phẩm & Quy cách</p>
          <p className="font-bold text-gray-800 text-sm">{lsx.requiredQuantity}kg ({lsx.targetRolls} cuộn) • {lsx.specs}</p>
        </div>
      </div>

      {/* Notes */}
      {lsx.notes && (
        <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100 text-[11px] text-amber-700 font-medium">
          <span className="font-bold uppercase mr-2 opacity-50 tracking-tighter">Ghi chú xưởng:</span>
          {lsx.notes}
        </div>
      )}
    </Card>
  );
};

export default ProductionOrderCard;
