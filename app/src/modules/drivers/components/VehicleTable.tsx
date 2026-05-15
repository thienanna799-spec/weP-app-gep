import React, { useState } from 'react';
import { Eye, Edit2, Truck, Calendar, Plus, ChevronDown } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { Vehicle } from '../types';
import { VehicleStatusBadge } from './StatusBadges';

interface VehicleTableProps {
  vehicles: Vehicle[];
  onView: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onAdd: () => void;
}

const ROWS_OPTIONS = [5, 10, 20];

export const VehicleTable: React.FC<VehicleTableProps> = ({ vehicles, onView, onEdit, onAdd }) => {
  const [visibleRows, setVisibleRows] = useState(5);

  const displayedVehicles = vehicles.slice(0, visibleRows);
  const hasMore = vehicles.length > visibleRows;

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden border-none shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Biển số / Loại xe</th>
                <th className="px-6 py-4">Tải trọng</th>
                <th className="px-6 py-4">Km hiện tại</th>
                <th className="px-6 py-4">Tài xế đang dùng</th>
                <th className="px-6 py-4">Bảo hiểm / Đăng kiểm</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm">
              {displayedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Truck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">Chưa có phương tiện nào</p>
                    <p className="text-xs text-slate-300 mt-1">Nhấn "Thêm xe" để khai báo phương tiện mới</p>
                  </td>
                </tr>
              ) : displayedVehicles.map((vehicle) => {
                const vAny = vehicle as any;
                const activeDriver = vAny.activeDriverName || null;
                const activeCheckIn = vAny.activeCheckIn ? new Date(vAny.activeCheckIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
                return (
                <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-slate-900 uppercase">{vehicle.plateNumber}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{vehicle.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {vehicle.capacity} kg
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">
                    {vehicle.currentMileage.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4">
                    {activeDriver ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200/50 rounded-lg">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-bold text-emerald-700">{activeDriver}</span>
                        </div>
                        <span className="text-[9px] text-slate-400">{activeCheckIn}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">— Không có —</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[10px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-500">BH: {vehicle.insuranceExpiry}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-500">ĐK: {vehicle.registrationDate}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <VehicleStatusBadge status={vehicle.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onView(vehicle)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(vehicle)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-colors" title="Sửa thông tin">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: Show more / Rows selector */}
        {vehicles.length > 5 && (
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              Hiển thị {Math.min(visibleRows, vehicles.length)} / {vehicles.length} xe
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Số dòng:</span>
              {ROWS_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setVisibleRows(n)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${
                    visibleRows === n 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              {!ROWS_OPTIONS.includes(vehicles.length) && (
                <button
                  onClick={() => setVisibleRows(vehicles.length)}
                  className={`text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${
                    visibleRows >= vehicles.length 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Tất cả
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Add Vehicle Button — outside table, bottom-left */}
      <div className="flex justify-start">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-bold text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm xe
        </button>
      </div>
    </div>
  );
};
