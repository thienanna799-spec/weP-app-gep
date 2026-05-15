import React, { useState, useEffect } from 'react';
import { 
  Truck, Calendar, Settings, History, Fuel,
  Shield, AlertCircle, Clock
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { Vehicle, VehicleMaintenance, FuelLog } from '../types';
import { VehicleStatusBadge } from './StatusBadges';
import { formatDate, formatCurrency } from '../../../utils/format';
import api from '../../../services/api';

interface DailyLog {
  id: string;
  driverName: string;
  plateNumber: string;
  logDate: string;
  status: string;
  startKm?: number;
  endKm?: number;
  totalKm?: number;
  checkInTime?: string;
  checkOutTime?: string;
}

interface VehicleDetailProps {
  vehicle: Vehicle;
  maintenances: VehicleMaintenance[];
  fuelLogs: FuelLog[];
  onClose: () => void;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, maintenances, fuelLogs, onClose }) => {
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    api.get<DailyLog[]>(`/daily-logs?vehicleId=${vehicle.id}`)
      .then(logs => setRecentLogs(logs.slice(0, 5)))
      .catch(() => {});
  }, [vehicle.id]);

  const insuranceExpiryDate = new Date(vehicle.insuranceExpiry);
  const isInsuranceExpiring = (insuranceExpiryDate.getTime() - Date.now()) < (1000 * 60 * 60 * 24 * 30);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 space-y-4">
           <Card className="p-6 flex flex-col items-center text-center">
              <div className="p-4 bg-slate-900 text-white rounded-3xl mb-4">
                 <Truck className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase font-mono">{vehicle.plateNumber}</h3>
              <p className="text-slate-500 text-sm mb-4">{vehicle.type} • {vehicle.year}</p>
              <VehicleStatusBadge status={vehicle.status} />

              <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Settings className="w-4 h-4" /> Km hiện tại</span>
                    <span className="font-mono font-bold text-blue-600">{vehicle.currentMileage.toLocaleString()} km</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Đăng kiểm</span>
                    <span className="font-bold text-slate-900">{vehicle.registrationDate}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Shield className="w-4 h-4" /> Bảo hiểm</span>
                    <span className={`font-bold ${isInsuranceExpiring ? 'text-rose-600' : 'text-slate-900'}`}>{vehicle.insuranceExpiry}</span>
                 </div>
              </div>
           </Card>

           {isInsuranceExpiring && (
             <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-medium">Bảo hiểm sắp hết hạn trong vòng 30 ngày tới. Vui lòng làm thủ tục gia hạn.</p>
             </div>
           )}
        </div>

        <div className="flex-1 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Maintenance History */}
              <Card className="p-6">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Lịch sử bảo trì</span>
                    <button className="text-blue-600 hover:underline">Tất cả</button>
                 </h4>
                 <div className="space-y-4">
                    {maintenances.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">Chưa có lịch sử bảo trì</p>
                    ) : (
                      maintenances.slice(0, 5).map(m => (
                        <div key={m.id} className="flex gap-3 relative before:absolute before:left-2 before:top-6 before:bottom-0 before:w-0.5 before:bg-slate-50">
                           <div className="w-4 h-4 rounded-full bg-indigo-100 border-2 border-white shrink-0 z-10" />
                           <div className="text-xs">
                              <p className="font-bold text-slate-900">{m.type}</p>
                              <p className="text-[10px] text-slate-500">{m.date} • {formatCurrency(m.cost)}</p>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </Card>

              {/* Fuel logs */}
              <Card className="p-6">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Fuel className="w-4 h-4" /> Lịch sử đổ xăng</span>
                 </h4>
                 <div className="space-y-3">
                   {fuelLogs.length === 0 ? (
                     <p className="text-xs text-slate-400 italic text-center py-4">Chưa có lịch sử đổ xăng</p>
                   ) : (
                     fuelLogs.slice(0, 5).map(log => (
                       <div key={log.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                          <div>
                             <p className="text-[10px] font-bold text-slate-900">{formatCurrency(log.amount)}</p>
                             <p className="text-[9px] text-slate-500">{log.volume} L • {formatDate(log.date)}</p>
                          </div>
                          <p className="text-[9px] font-mono text-slate-400">{log.mileage.toLocaleString()} km</p>
                       </div>
                     ))
                   )}
                 </div>
              </Card>
           </div>

           {/* Real-time usage logs from DailyVehicleLog */}
           <Card className="p-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <History className="w-4 h-4" /> Nhật ký sử dụng gần đây
              </h4>
              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Chưa có nhật ký sử dụng</p>
                ) : recentLogs.map(log => {
                  const isActive = log.status === 'active';
                  const checkIn = log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
                  const checkOut = log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
                  const logDateStr = formatDate(log.logDate);
                  return (
                    <div key={log.id} className="flex items-center justify-between text-xs p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.driverName)}&background=${isActive ? '10b981' : '94a3b8'}&color=fff&size=32`} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-slate-900">{log.driverName}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {logDateStr}
                            {checkIn && ` • ${checkIn}`}
                            {checkOut && ` → ${checkOut}`}
                            {log.totalKm != null && ` • ${log.totalKm} km`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isActive ? 'blue' : 'green'}>
                        {isActive ? '🟢 Đang dùng' : '✅ Hoàn thành'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
