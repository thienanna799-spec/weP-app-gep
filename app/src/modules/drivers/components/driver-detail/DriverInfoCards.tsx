import React from 'react';
import { CreditCard, Truck, Fuel, Clock, CheckCircle } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import { Driver, Vehicle } from '../../types';
import { formatCurrency } from '../../../../utils/format';

// Simple TrendingUp icon (not in lucide-react)
const TrendingUp = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

interface DriverStats {
  totalDeliveries: number;
  successDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  totalFuelCost: number;
  lastGpsTimestamp: string | null;
}

interface DriverInfoCardsProps {
  driver: Driver;
  vehicle?: Vehicle;
  driverStats?: DriverStats | null;
}

export const DriverInfoCards: React.FC<DriverInfoCardsProps> = ({ driver, vehicle, driverStats }) => {
  // ✅ Fix BUG 3: Calculate real values from API stats
  const deliveryCount = driverStats?.totalDeliveries ?? '—';
  const successRate = driverStats ? `${driverStats.successRate}%` : '—';
  const fuelCost = driverStats ? formatCurrency(driverStats.totalFuelCost) : '—';
  const lastGps = driverStats?.lastGpsTimestamp
    ? (() => {
        const diff = Date.now() - new Date(driverStats.lastGpsTimestamp).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins}p`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
      })()
    : '—';

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-slate-50 border-none">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CreditCard className="w-3 h-3" /> Hồ sơ năng lực
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Bằng lái:</span>
              <span className="font-bold text-slate-900 uppercase">{driver.licenseNo} ({driver.licenseType})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hết hạn:</span>
              <span className="font-bold text-rose-600">{driver.licenseExpiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CMND/CCCD:</span>
              <span className="font-bold text-slate-900">{driver.idCard}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày sinh:</span>
              <span className="font-bold text-slate-900">{driver.dob}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-50 border-none">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Truck className="w-3 h-3" /> Phương tiện đang dùng
            {(driver as any).todayPlate && (
              <span className="flex items-center gap-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none ml-auto">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </h4>
          {vehicle ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Biển số:</span>
                <span className="font-mono font-bold text-indigo-600 uppercase">{vehicle.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loại xe:</span>
                <span className="font-bold text-slate-900">{vehicle.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tải trọng:</span>
                <span className="font-bold text-slate-900">{vehicle.capacity} kg</span>
              </div>
            </div>
          ) : (driver as any).todayPlate ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Biển số:</span>
                <span className="font-mono font-bold text-emerald-600 uppercase">{(driver as any).todayPlate}</span>
              </div>
              <p className="text-[10px] text-emerald-500 mt-1">🟢 Đang sử dụng hôm nay (từ APK check-in)</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Chưa gán phương tiện</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Giao hàng', val: deliveryCount, sub: 'Đơn', icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Thành công', val: successRate, sub: 'Tỷ lệ', icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Nhiên liệu', val: fuelCost, sub: '', icon: Fuel, color: 'text-orange-500' },
          { label: 'GPS Lần cuối', val: lastGps, sub: lastGps === '—' ? '' : 'trước', icon: Clock, color: 'text-slate-500' },
        ].map((stat, i) => (
          <div key={i} className="text-center p-3 rounded-2xl bg-white border border-slate-100">
            <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
            <p className="text-lg font-black text-slate-900 leading-tight">{stat.val}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</p>
            {stat.sub && <p className="text-[8px] text-slate-300">{stat.sub}</p>}
          </div>
        ))}
      </div>
    </>
  );
};
