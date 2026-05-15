import React from 'react';
import { Eye, Edit2, Lock, Unlock, Phone, Truck, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { Driver, Vehicle } from '../types';
import { DriverStatusBadge } from './StatusBadges';

interface DriverTableProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onView: (driver: Driver) => void;
  onEdit: (driver: Driver) => void;
  onBlock: (driver: Driver) => void;
  onAssign: (driver: Driver) => void;
}

export const DriverTable: React.FC<DriverTableProps> = ({ drivers, vehicles, onView, onEdit, onBlock, onAssign }) => {
  const getVehiclePlate = (vId?: string) => {
    if (!vId) return null;
    return vehicles.find(v => v.id === vId)?.plateNumber || null;
  };

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Tài xế</th>
              <th className="px-6 py-4">Mã / Liên hệ</th>
              <th className="px-6 py-4">Bằng lái</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Xe sử dụng</th>
              <th className="px-6 py-4">Hoạt động</th>
              <th className="px-6 py-4">Uy tín (Score)</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-sm">
            {drivers.map((driver) => {
              const driverAny = driver as any;
              // Only show the live plate from today's shift.
              // If they ended the shift, this becomes null, showing the "Trống / Gán xe" status.
              const plate = driverAny.todayPlate || null;
              const isLive = !!driverAny.todayPlate;
              return (
                <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">
                    <div className="flex items-center gap-3">
                      <img src={driver.avatar || `https://ui-avatars.com/api/?name=${driver.name}`} alt="" className="w-10 h-10 rounded-full border border-slate-200" />
                      <span>{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-mono text-xs font-bold text-blue-600">{driver.code}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                         <Phone className="w-3 h-3" />
                         {driver.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <span className="font-bold text-slate-700 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{driver.licenseType}</span>
                    <p className="text-[10px] text-slate-400 mt-1">Hết hạn: {driver.licenseExpiry}</p>
                  </td>
                  <td className="px-6 py-4">
                    <DriverStatusBadge status={driver.status} />
                  </td>
                  <td className="px-6 py-4">
                    {plate ? (
                      <button
                        onClick={() => onAssign(driver)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          isLive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/50'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200/50'
                        }`}
                        title={isLive ? 'Đang sử dụng hôm nay (từ APK)' : 'Click để đổi xe'}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs font-bold uppercase">{plate}</span>
                        {isLive && (
                          <span className="flex items-center gap-0.5 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => onAssign(driver)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 border border-dashed border-amber-200 transition-colors cursor-pointer"
                        title="Gán xe cho tài xế"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">Gán xe</span>
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                     {(() => {
                       const count = (driver as any).activeOrderCount || 0;
                       return count > 0
                         ? <span className="text-blue-600 font-bold">{count} đơn đang giao</span>
                         : <span className="text-slate-400">Không có đơn</span>;
                     })()}
                  </td>
                  <td className="px-6 py-4">
                     {(() => {
                       const score = driver.trustScore !== undefined ? driver.trustScore : 100;
                       if (score >= 90) return (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 w-fit">
                           <ShieldCheck className="w-4 h-4" />
                           <span className="font-bold text-xs">{score}/100</span>
                         </div>
                       );
                       if (score >= 70) return (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 w-fit">
                           <AlertTriangle className="w-4 h-4" />
                           <span className="font-bold text-xs">{score}/100</span>
                         </div>
                       );
                       return (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 w-fit animate-pulse">
                           <ShieldAlert className="w-4 h-4" />
                           <span className="font-bold text-xs">{score}/100</span>
                         </div>
                       );
                     })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onView(driver)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(driver)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-colors" title="Sửa thông tin">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onBlock(driver)} 
                        className={`p-1.5 rounded-lg border border-transparent transition-colors ${
                          driver.status === 'blocked' 
                            ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100' 
                            : 'text-rose-600 hover:bg-rose-50 hover:border-rose-100'
                        }`}
                        title={driver.status === 'blocked' ? 'Mở khóa tài xế' : 'Khóa tài xế'}
                      >
                        {driver.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
