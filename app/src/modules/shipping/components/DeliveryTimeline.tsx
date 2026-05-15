import React from 'react';
import { CheckCircle2, Clock, Truck, Package, PackageCheck, MapPin, AlertTriangle } from 'lucide-react';

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const STEPS: TimelineStep[] = [
  { key: 'created', label: 'Tạo phiếu', icon: <Package className="w-4 h-4" />, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { key: 'preparing', label: 'Soạn hàng', icon: <PackageCheck className="w-4 h-4" />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { key: 'exported', label: 'Đã xuất kho', icon: <PackageCheck className="w-4 h-4" />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { key: 'assigned', label: 'Giao xe', icon: <Truck className="w-4 h-4" />, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { key: 'delivering', label: 'Đang giao', icon: <MapPin className="w-4 h-4" />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { key: 'completed', label: 'Hoàn thành', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600', bgColor: 'bg-green-100' },
];

function getActiveStep(status: string): number {
  const map: Record<string, number> = {
    cho_xuat_kho: 0,
    dang_chuan_bi: 1,
    da_xuat_kho: 2,
    da_ban_giao_tai_xe: 3,
    dang_giao: 4,
    giao_thanh_cong: 5,
    giao_that_bai: 5,
    hoan_tra: 5,
  };
  return map[status] ?? 0;
}

interface DeliveryTimelineProps {
  status: string;
  deliveryLogs: any[];
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failReason?: string;
}

function formatTime(d: string | undefined) {
  if (!d) return '';
  const date = new Date(d);
  return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString('vi-VN')}`;
}

const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
  status, deliveryLogs, createdAt, shippedAt, deliveredAt, failedAt, failReason,
}) => {
  const activeStep = getActiveStep(status);
  const isFailed = status === 'giao_that_bai';

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200" />
        <div className="absolute top-5 left-8 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700"
          style={{ width: `${Math.min(100, (activeStep / (STEPS.length - 1)) * 100)}%`, maxWidth: 'calc(100% - 64px)' }} />
        
        {STEPS.map((step, idx) => {
          const isActive = idx <= activeStep;
          const isCurrent = idx === activeStep;
          return (
            <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isCurrent ? `${step.bgColor} ${step.color} border-current ring-4 ring-current/10 scale-110` :
                  isActive ? `${step.bgColor} ${step.color} border-transparent` :
                  'bg-white text-slate-300 border-slate-200'}`}>
                {isActive ? step.icon : <Clock className="w-4 h-4" />}
              </div>
              <p className={`text-[9px] font-bold mt-2 text-center leading-tight ${isCurrent ? step.color : isActive ? 'text-slate-600' : 'text-slate-300'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Failed warning */}
      {isFailed && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">Giao hàng thất bại</p>
            {failReason && <p className="text-xs text-red-600 mt-0.5">{failReason}</p>}
            {failedAt && <p className="text-[10px] text-red-400 mt-1">{formatTime(failedAt)}</p>}
          </div>
        </div>
      )}

      {/* Delivery Logs */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Nhật ký giao hàng</h4>
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-4">
          {deliveryLogs.length > 0 ? (
            deliveryLogs.map((log: any, idx: number) => (
              <div key={log.id} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm
                  ${idx === 0 ? 'bg-blue-500 ring-2 ring-blue-500/20' : 'bg-slate-300'}`} />
                <div className="p-2.5 bg-white rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                  <p className="font-bold text-sm text-slate-900">{log.action}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(log.createdAt)}</p>
                  {log.note && <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-2 rounded">{log.note}</p>}
                  {log.latitude && log.longitude && (
                    <p className="text-[9px] text-slate-400 font-mono mt-1">📍 {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}</p>
                  )}
                  {log.imageUrl && (
                    <img src={log.imageUrl} alt="Delivery" className="mt-2 w-full rounded-lg border border-slate-200 max-h-48 object-cover" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="pl-6 text-sm text-slate-400 italic py-2">Chưa có cập nhật từ tài xế...</div>
          )}
          {/* Created event */}
          <div className="relative pl-6">
            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-slate-200" />
            <p className="text-sm font-medium text-slate-500">Tạo phiếu xuất kho</p>
            <p className="text-[10px] text-slate-400">{formatTime(createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTimeline;
