import React from 'react';
import { User, Phone, Truck, MapPin, Clock } from 'lucide-react';

interface DriverInfoCardProps {
  driver: {
    name: string;
    phone: string;
    code: string;
    status: string;
    avatar?: string;
  } | null;
  vehicle?: string;
  shippedAt?: string;
  deliveryDeadline?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: 'Sẵn sàng', color: 'bg-green-100 text-green-700' },
  delivering: { label: 'Đang giao', color: 'bg-orange-100 text-orange-700' },
  leave: { label: 'Nghỉ phép', color: 'bg-slate-100 text-slate-600' },
  inactive: { label: 'Không hoạt động', color: 'bg-red-100 text-red-600' },
};

const DriverInfoCard: React.FC<DriverInfoCardProps> = ({ driver, vehicle, shippedAt, deliveryDeadline }) => {
  if (!driver) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
        <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400 font-medium">Chưa gán tài xế</p>
      </div>
    );
  }

  const st = statusLabels[driver.status] || { label: driver.status, color: 'bg-slate-100 text-slate-600' };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
          {driver.avatar ? (
            <img src={driver.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            driver.name.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900">{driver.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{driver.code}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">{driver.phone}</span>
        </div>
        {vehicle && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">{vehicle}</span>
          </div>
        )}
        {shippedAt && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600">{new Date(shippedAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {deliveryDeadline && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-bold text-amber-700">Hạn: {new Date(deliveryDeadline).toLocaleString('vi-VN')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverInfoCard;
