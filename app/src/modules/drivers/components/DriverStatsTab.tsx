import React from 'react';
import Card from '../../../components/ui/Card';
import { formatCurrency } from '../../../utils/format';
import { Driver } from '../types';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface DriverStatsTabProps {
  stats: {
    totalDrivers: number;
    availableDrivers: number;
    deliveringDrivers: number;
    activeVehicles: number;
    maintenanceVehicles: number;
    totalFuelCost: number;
    totalMaintenanceCost: number;
    successfulDeliveries: number;
    failedDeliveries: number;
  };
  totalVehicles: number;
  fuelLogsCount: number;
  maintenancesCount: number;
  drivers: Driver[];
}

export const DriverStatsTab: React.FC<DriverStatsTabProps> = ({
  stats, totalVehicles, fuelLogsCount, maintenancesCount, drivers
}) => {
  const sortedDrivers = [...drivers].sort((a, b) => (b.trustScore ?? 100) - (a.trustScore ?? 100));
  const topDrivers = sortedDrivers.slice(0, 5);
  const bottomDrivers = [...sortedDrivers].reverse().slice(0, 5).filter(d => (d.trustScore ?? 100) < 90);

  return (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5 border-none shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng tài xế</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalDrivers}</p>
        <p className="text-xs text-emerald-600 mt-1">{stats.availableDrivers} sẵn sàng · {stats.deliveringDrivers} đang giao</p>
      </Card>
      <Card className="p-5 border-none shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phương tiện</p>
        <p className="text-3xl font-black text-slate-900 mt-1">{totalVehicles}</p>
        <p className="text-xs text-blue-600 mt-1">{stats.activeVehicles} hoạt động · {stats.maintenanceVehicles} bảo trì</p>
      </Card>
      <Card className="p-5 border-none shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi phí nhiên liệu</p>
        <p className="text-3xl font-black text-orange-600 mt-1">{formatCurrency(stats.totalFuelCost)}</p>
        <p className="text-xs text-slate-400 mt-1">{fuelLogsCount} lượt nạp</p>
      </Card>
      <Card className="p-5 border-none shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi phí bảo trì</p>
        <p className="text-3xl font-black text-rose-600 mt-1">{formatCurrency(stats.totalMaintenanceCost)}</p>
        <p className="text-xs text-slate-400 mt-1">{maintenancesCount} lần bảo trì</p>
      </Card>
    </div>
    <Card className="p-6 border-none shadow-md">
      <h3 className="text-sm font-black text-slate-700 mb-4">Giao hàng</h3>
      <div className="flex items-center gap-8">
        <div>
          <p className="text-4xl font-black text-emerald-600">{stats.successfulDeliveries}</p>
          <p className="text-xs text-slate-400">Thành công</p>
        </div>
        <div>
          <p className="text-4xl font-black text-rose-500">{stats.failedDeliveries}</p>
          <p className="text-xs text-slate-400">Thất bại</p>
        </div>
        <div>
          <p className="text-4xl font-black text-blue-600">
            {stats.successfulDeliveries + stats.failedDeliveries > 0
              ? Math.round((stats.successfulDeliveries / (stats.successfulDeliveries + stats.failedDeliveries)) * 100)
              : 0}%
          </p>
          <p className="text-xs text-slate-400">Tỷ lệ thành công</p>
        </div>
      </div>
    </Card>

    {/* Ranking Bảng Vàng & Bảng Đen */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 shadow-sm border-emerald-100">
        <h3 className="text-sm font-black text-emerald-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" /> Bảng Uy tín (Top Drivers)
        </h3>
        <div className="space-y-3">
          {topDrivers.length === 0 && <p className="text-xs text-slate-400">Chưa có dữ liệu</p>}
          {topDrivers.map((d, i) => (
            <div key={d.id} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-lg border border-emerald-50">
              <div className="flex gap-3 items-center">
                <span className="font-black text-emerald-300 w-4">{i + 1}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{d.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{d.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                <span className="font-bold text-sm">{d.trustScore ?? 100}</span>
                <span className="text-[10px] uppercase font-bold">điểm</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 shadow-sm border-rose-100">
        <h3 className="text-sm font-black text-rose-900 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" /> Cảnh báo Rủi ro OCR (Gian lận)
        </h3>
        <div className="space-y-3">
          {bottomDrivers.length === 0 && <p className="text-xs text-slate-400 italic">Không có tài xế nào dính cờ rủi ro OCR.</p>}
          {bottomDrivers.map((d, i) => (
            <div key={d.id} className="flex justify-between items-center p-3 bg-rose-50/50 rounded-lg border border-rose-50">
              <div className="flex gap-3 items-center">
                <span className="font-black text-rose-300 w-4">{i + 1}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{d.name}</p>
                  <p className="text-[10px] text-rose-500 font-medium">{d.fraudFlags?.duplicates ?? 0} trùng lặp · {d.fraudFlags?.rejected ?? 0} từ chối</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-rose-600 bg-rose-100 px-2 py-1 rounded animate-pulse">
                <span className="font-bold text-sm">{d.trustScore ?? 100}</span>
                <span className="text-[10px] uppercase font-bold">điểm</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
  );
};
