/**
 * Sub-components for the Dispatch page detail panel
 */
import React from 'react';
import { MapPin, XCircle, CheckCircle2, Clock, User, Truck, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';

export function DetailHeader({ order, getStatusBadge, onClose }: any) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-xl font-black text-slate-900">Đơn #{order.code}</h3>
        <p className="text-sm text-slate-500">{order.customerName} • {order.customerPhone}</p>
        <p className="text-xs text-slate-400 mt-1"><MapPin className="w-3 h-3 inline mr-1" />{order.customerAddress}</p>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(order.status)}
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><XCircle className="w-5 h-5 text-slate-400" /></button>
      </div>
    </div>
  );
}

export function DetailItems({ items }: { items?: any[] }) {
  if (!items?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h4 className="text-sm font-bold text-slate-700">Sản phẩm ({items.length} loại)</h4>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <th className="px-3 py-2.5 text-center w-10">STT</th>
            <th className="px-3 py-2.5">SUB-SKU</th>
            <th className="px-3 py-2.5">Sản phẩm</th>
            <th className="px-3 py-2.5 text-center w-20">Số lượng</th>
            <th className="px-3 py-2.5 text-center w-16">ĐVT</th>
            <th className="px-3 py-2.5">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item: any, idx: number) => (
            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
              <td className="px-3 py-2 text-center text-xs text-slate-400">{idx + 1}</td>
              <td className="px-3 py-2 text-xs font-mono text-blue-700 font-bold">{item.subSku || '—'}</td>
              <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.productName}</td>
              <td className="px-3 py-2 text-center text-sm font-bold text-slate-900">{item.quantity}</td>
              <td className="px-3 py-2 text-center text-xs text-slate-500">{item.unit}</td>
              <td className="px-3 py-2 text-xs text-slate-400">{item.note || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailStatusInfo({ order }: { order: any }) {
  if (!['da_duyet', 'dang_chuan_bi'].includes(order.status)) return null;
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-blue-600" />
        <h4 className="text-sm font-bold text-blue-800">
          {order.status === 'da_duyet' ? 'Đơn đã duyệt — Đang chờ soạn hàng' : 'Đang soạn hàng (Picking)'}
        </h4>
      </div>
      <p className="text-xs text-blue-700">
        {order.status === 'da_duyet'
          ? 'Đơn hàng đã được duyệt. Nhân viên kho đang chuẩn bị soạn hàng bên tab "Chuẩn bị xuất".'
          : 'Nhân viên đang quét QR để soạn cuộn hàng cho đơn này. Khi soạn xong, trạng thái sẽ chuyển sang "Sẵn sàng xuất".'}
      </p>
    </div>
  );
}

export function DriverAssignForm({ drivers, driverName, vehicle, deadline, setDriverName, setVehicle, setDeadline, onAssign, loading, onDriverSelect }: any) {
  const handleDriverChange = (e: any) => {
    const selectedName = e.target.value;
    setDriverName(selectedName);

    if (!selectedName) {
      if (onDriverSelect) onDriverSelect(null);
      setVehicle('');
      return;
    }

    // Find the selected driver to get their id and vehicle
    const driver = drivers.find((d: any) => d.name === selectedName);
    if (driver) {
      if (onDriverSelect) onDriverSelect(driver.id);
      // Priority: todayPlate (from APK check-in) → static vehicle assignment
      const resolvedPlate = driver.todayPlate || driver.vehicle?.plateNumber;
      if (resolvedPlate) {
        setVehicle(resolvedPlate);
      } else {
        setVehicle('');
      }
    }
  };

  const selectedDriver = drivers.find((d: any) => d.name === driverName);
  const resolvedPlate = selectedDriver?.todayPlate || selectedDriver?.vehicle?.plateNumber;
  const isAutoFilled = !!resolvedPlate && vehicle === resolvedPlate;
  const isLivePlate = !!selectedDriver?.todayPlate && vehicle === selectedDriver.todayPlate;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2"><User className="w-4 h-4" /> Gán tài xế & Xuất kho</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-600">Tài xế</label>
          {drivers.length > 0 ? (
            <select className="w-full h-10 border rounded-lg px-3 text-sm" value={driverName} onChange={handleDriverChange}>
              <option value="">-- Chọn tài xế --</option>
              {drivers.filter((d: any) => d.status === 'available').map((d: any) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code}){d.todayPlate ? ` • ${d.todayPlate} 🟢` : d.vehicle ? ` • ${d.vehicle.plateNumber}` : ''}
                </option>
              ))}
            </select>
          ) : <input className="w-full h-10 border rounded-lg px-3 text-sm" value={driverName} onChange={(e: any) => setDriverName(e.target.value)} placeholder="Tên tài xế" />}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            Phương tiện
            {isAutoFilled && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isLivePlate ? 'bg-emerald-100 text-emerald-700' : 'bg-green-100 text-green-700'}`}>
                {isLivePlate ? '● LIVE từ APK' : '✓ Tự động'}
              </span>
            )}
          </label>
          <input
            className={`w-full h-10 border rounded-lg px-3 text-sm ${isAutoFilled ? 'bg-green-50 border-green-300 font-bold text-green-800' : ''}`}
            value={vehicle}
            onChange={(e: any) => setVehicle(e.target.value)}
            placeholder={driverName ? 'Chưa gán xe — nhập tay' : 'VD: 29C-12345'}
          />
          {driverName && !vehicle && (
            <p className="text-[10px] text-amber-600 font-medium mt-1">⚠ Tài xế chưa được gán xe. Nhập biển số tay hoặc gán xe trong mục Tài Xế.</p>
          )}
        </div>
      </div>
      <div><label className="text-xs font-bold text-slate-600">Thời hạn giao</label><input type="datetime-local" className="w-full h-10 border rounded-lg px-3 text-sm" value={deadline} onChange={(e: any) => setDeadline(e.target.value)} /></div>
      <Button onClick={onAssign} disabled={loading || !driverName || !deadline} className="w-full bg-blue-600 hover:bg-blue-700">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
        Xác nhận xuất kho & Giao hàng
      </Button>
    </div>
  );
}

export function DeliveryActions({ order, onComplete, onFail }: any) {
  return (
    <div className="space-y-3">
      {order.shippingOrder && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-orange-800 mb-2">Thông tin giao hàng</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Tài xế:</span> <span className="font-bold">{order.shippingOrder.assignedDriverName}</span></div>
            <div><span className="text-slate-500">Phương tiện:</span> <span className="font-bold">{order.shippingOrder.assignedVehicle}</span></div>
            <div><span className="text-slate-500">Mã phiếu:</span> <span className="font-mono text-blue-600">{order.shippingOrder.code}</span></div>
            <div><span className="text-slate-500">Số cuộn:</span> <span className="font-bold">{order.shippingOrder.totalQuantity}/{order.shippingOrder.totalRolls}</span></div>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <Button onClick={onComplete} className="flex-1 bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4 mr-2" />Giao thành công</Button>
        <Button onClick={onFail} variant="secondary" className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"><XCircle className="w-4 h-4 mr-2" />Giao thất bại</Button>
      </div>
    </div>
  );
}
