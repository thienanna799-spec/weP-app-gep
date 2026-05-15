import React from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { Driver, Vehicle } from '../types';
import { Truck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  vehicles: Vehicle[];
  onAssign: (vehicleId: string) => void;
  loading?: boolean;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({ 
  isOpen, 
  onClose, 
  driver, 
  vehicles, 
  onAssign,
  loading 
}) => {
  const driverAny = driver as any;
  const todayPlate = driverAny.todayPlate || null;
  const todayVehicleId = driverAny.todayVehicleId || null;
  const todayVehicle = todayVehicleId ? vehicles.find(v => v.id === todayVehicleId) : null;

  // Static assignment (from admin manual assign)
  const staticVehicle = driver.currentVehicleId ? vehicles.find(v => v.id === driver.currentVehicleId) : null;

  // Determine which vehicle is active
  const activeVehicle = todayVehicle || staticVehicle;
  const isFromShift = !!todayVehicle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Phương tiện của ${driver.name}`}>
      <div className="space-y-6 py-4">

        {/* Live shift vehicle info */}
        {isFromShift ? (
          <div className="space-y-4">
            {/* Status banner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Đã vào ca làm việc</p>
                <p className="text-xs text-emerald-600">Phương tiện được gán tự động từ ca làm việc hôm nay</p>
              </div>
            </div>

            {/* Vehicle card */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-mono font-black text-lg text-slate-900 uppercase tracking-wide">{todayPlate}</p>
                    {todayVehicle && (
                      <p className="text-xs text-slate-500 capitalize">{todayVehicle.type} • {todayVehicle.capacity} Kg</p>
                    )}
                  </div>
                </div>
                <span className="flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
              </div>
            </div>

            {/* Info notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Phương tiện này được lấy tự động khi nhân viên <strong>vào ca (check-in)</strong> trên ứng dụng DriverGo. 
                Khi <strong>kết ca (check-out)</strong>, phương tiện sẽ được trả lại tự động.
              </p>
            </div>
          </div>
        ) : staticVehicle ? (
          <div className="space-y-4">
            {/* Static assignment banner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Gán thủ công (cũ)</p>
                <p className="text-xs text-amber-600">Tài xế chưa vào ca hôm nay — hiển thị xe gán tĩnh trước đó</p>
              </div>
            </div>

            {/* Static vehicle card */}
            <div className="p-5 rounded-2xl border-2 border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-mono font-black text-lg text-slate-900 uppercase tracking-wide">{staticVehicle.plateNumber}</p>
                  <p className="text-xs text-slate-500 capitalize">{staticVehicle.type} • {staticVehicle.capacity} Kg</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Khi tài xế <strong>vào ca trên DriverGo</strong>, phương tiện sẽ được cập nhật tự động theo biển số khai báo trong ca làm việc.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* No vehicle banner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <AlertTriangle className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-700">Chưa có phương tiện</p>
                <p className="text-xs text-slate-500">Tài xế chưa vào ca và chưa được gán xe</p>
              </div>
            </div>

            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Truck className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 max-w-[280px]">
                Phương tiện sẽ được gán tự động khi tài xế <strong>vào ca (check-in)</strong> trên ứng dụng DriverGo.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
};
