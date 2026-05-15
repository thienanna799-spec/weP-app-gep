/**
 * ShippingDetailPanel — Full detail view for a shipping order
 *
 * Replaces Google Maps iframe with Leaflet/OpenStreetMap.
 * Integrates: DeliveryMap, DeliveryTimeline, DriverInfoCard, ProofOfDelivery
 * WarehouseExportPanel extracted to WarehouseExportPanel.tsx
 */
import React from 'react';
import {
  Truck, Users, MapPin,
  CheckCircle2, Phone, User, XCircle
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ShippingOrder, DeliveryLog } from '../types';
import { formatDateTime } from '../../../utils/format';
import DeliveryMap from './DeliveryMap';
import DeliveryTimeline from './DeliveryTimeline';
import DriverInfoCard from './DriverInfoCard';
import ProofOfDelivery from './ProofOfDelivery';
import WarehouseExportPanel from './WarehouseExportPanel';

interface ShippingDetailPanelProps {
  detail: (ShippingOrder & { items: any[], deliveryLogs: DeliveryLog[], gpsLogs?: any[], driver?: any }) | null;
  detailLoading: boolean;
  onClose: () => void;
  scanCode: string;
  setScanCode: (v: string) => void;
  scanLoading: boolean;
  scanError: string | null;
  onScanRoll: () => void;
  assignData: { driverId: string; driverName: string; vehicle: string; deadline: string };
  setAssignData: (v: any) => void;
  onAssignDriver: () => void;
  onStatusChange: (action: string) => void;
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

const ShippingDetailPanel: React.FC<ShippingDetailPanelProps> = ({
  detail, detailLoading, onClose,
  scanCode, setScanCode, scanLoading, scanError, onScanRoll,
  assignData, setAssignData, onAssignDriver, onStatusChange,
  getStatusColor, getStatusLabel
}) => {
  if (detailLoading || !detail) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>;
  }

  const isTracking = ['da_ban_giao_tai_xe', 'da_ban_giao', 'dang_giao', 'giao_thanh_cong', 'giao_that_bai'].includes(detail.status);

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-white shrink-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-2xl font-black text-slate-900">{detail.code}</h3>
              <Badge variant={detail.status.includes('thanh_cong') ? 'green' : 'blue'}>{getStatusLabel(detail.status)}</Badge>
            </div>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <span className="text-slate-400">Đơn hàng:</span> <span className="font-bold text-slate-700">#{detail.orderId}</span>
            </p>
          </div>
          <Button variant="secondary" onClick={onClose}>Đóng Panel</Button>
        </div>

        {/* Customer Info */}
        <div className="flex gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><User className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Khách hàng</p>
              <p className="font-bold text-sm text-slate-900">{detail.customerName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3"/> {detail.customerPhone}</p>
            </div>
          </div>
          <div className="w-px bg-slate-200 shrink-0" />
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Địa chỉ giao hàng</p>
              <p className="font-medium text-sm text-slate-900 line-clamp-2">{detail.customerAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-6 custom-scrollbar">
        
        {/* 1. XUẤT KHO PANEL (if waiting/preparing) */}
        {['cho_xuat_kho', 'dang_chuan_bi'].includes(detail.status) && (
          <WarehouseExportPanel
            totalQuantity={detail.totalQuantity}
            totalRolls={detail.totalRolls}
            items={detail.items}
            scanCode={scanCode}
            setScanCode={setScanCode}
            scanLoading={scanLoading}
            scanError={scanError}
            onScanRoll={onScanRoll}
          />
        )}

        {/* 2. GÁN TÀI XẾ PANEL */}
        {detail.status === 'da_xuat_kho' && (
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <h4 className="font-bold text-lg text-slate-900 flex items-center gap-2 mb-6">
              <Users className="text-blue-500" /> Điều phối tài xế & Phương tiện
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tài xế</label>
                <input className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20" value={assignData.driverName} onChange={(e) => setAssignData({...assignData, driverName: e.target.value})} placeholder="Tên tài xế" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Biển số xe</label>
                <Input value={assignData.vehicle} onChange={(e: any) => setAssignData({...assignData, vehicle: e.target.value})} className="h-11 bg-slate-50" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Deadline giao hàng dự kiến</label>
                <Input type="datetime-local" value={assignData.deadline} onChange={(e: any) => setAssignData({...assignData, deadline: e.target.value})} className="h-11 bg-slate-50" />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={onAssignDriver} disabled={!assignData.deadline} className="bg-blue-600 hover:bg-blue-700 px-8">Xác nhận điều phối</Button>
            </div>
          </div>
        )}

        {/* 3. TRACKING — Leaflet Map + Timeline + Driver + Proof */}
        {isTracking && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col" style={{ minHeight: 400 }}>
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" /> Bản đồ giao hàng — Leaflet
                  </h4>
                </div>
                <div className="flex-1 relative">
                  <DeliveryMap
                    deliveryLogs={detail.deliveryLogs || []}
                    gpsLogs={(detail as any).gpsLogs || []}
                    driverName={detail.assignedDriverName || undefined}
                    vehiclePlate={detail.assignedVehicle || undefined}
                    className="absolute inset-0"
                  />
                </div>
              </div>

              <div className="xl:col-span-2 space-y-4">
                <DriverInfoCard
                  driver={(detail as any).driver || (detail.assignedDriverName ? {
                    name: detail.assignedDriverName,
                    phone: '',
                    code: '',
                    status: 'delivering',
                  } : null)}
                  vehicle={detail.assignedVehicle || undefined}
                  deliveryDeadline={detail.deliveryDeadline ? String(detail.deliveryDeadline) : undefined}
                />

                {['da_ban_giao_tai_xe', 'da_ban_giao', 'dang_giao'].includes(detail.status) && (
                  <div className="space-y-2">
                    {detail.status !== 'dang_giao' && (
                      <Button onClick={() => onStatusChange('Bắt đầu giao hàng')} className="w-full bg-orange-500 hover:bg-orange-600 gap-1.5">
                        <Truck className="w-4 h-4" /> Bắt đầu giao hàng
                      </Button>
                    )}
                    {detail.status === 'dang_giao' && (
                      <>
                        <Button onClick={() => onStatusChange('Giao hàng thành công')} className="w-full bg-green-600 hover:bg-green-700 gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Giao thành công
                        </Button>
                        <Button onClick={() => onStatusChange('Giao hàng thất bại')} variant="secondary" className="w-full bg-red-50 text-red-600 border-red-200 hover:bg-red-100 gap-1.5">
                          <XCircle className="w-4 h-4" /> Giao thất bại
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {detail.status === 'giao_thanh_cong' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
                    <p className="font-bold text-green-800 text-sm">Giao hàng thành công!</p>
                    {detail.deliveredAt && <p className="text-[10px] text-green-600 mt-1">{formatDateTime(detail.deliveredAt)}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <DeliveryTimeline
                status={detail.status}
                deliveryLogs={detail.deliveryLogs || []}
                createdAt={detail.createdAt as any}
                shippedAt={detail.shippedAt as any}
                deliveredAt={detail.deliveredAt as any}
                failedAt={detail.failedAt as any}
                failReason={detail.failReason || undefined}
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <ProofOfDelivery
                deliveryLogs={detail.deliveryLogs || []}
                deliveredAt={detail.deliveredAt as any}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ShippingDetailPanel;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               4294967294,471
4294967294,1452
4294967278,389
4294967293,131
4294967293,130
4294967293,129
4294967293,128
4294967293,127
4294967293,126
4294967293,125
4294967293,124
4294967293,123
4294967293,122
4294967293,121
4294967293,120
4294967293,119
4294967293,118
4294967293,117
4294967293,116
4294967293,115
4294967293,114
4294967293,113
4294967293,112
4294967293,111
4294967293,110
4294967293,109
4294967293,108
4294967293,107
4294967293,106
4294967293,105
4294967293,104
4294967293,103
4294967293,102
4294967293,101
4294967293,100
4294967293,99
4294967293,98
4294967293,97
4294967293,96
4294967293,95
4294967293,94
4294967293,93
4294967293,92
4294967293,91
4294967293,90
4294967293,89
4294967293,88
4294967293,87
4294967293,86
4294967293,85
4294967293,84
4294967293,83
4294967293,82
4294967293,81
4294967293,80
4294967293,79
4294967293,78
4294967293,77
4294967293,76
4294967293,75
4294967293,74
4294967293,73
4294967293,72
4294967293,71
4294967293,70
4294967293,69
4294967293,68
4294967293,67
4294967293,66
4294967293,65
4294967293,64
4294967293,63
4294967293,62
4294967293,61
4294967293,60
4294967293,59
4294967293,58
4294967293,57
4294967293,56
4294967293,55
4294967293,54
4294967293,53
4294967293,52
4294967293,51
4294967293,50
4294967293,49
4294967293,48
4294967293,47
4294967293,46
4294967293,45
4294967293,44
4294967293,43
4294967293,42
4294967293,41
4294967293,40
4294967293,39
4294967293,38
4294967293,37
4294967293,36
4294967293,35
4294967293,34
4294967293,33
4294967293,32
4294967293,31
4294967293,30
4294967293,29
4294967293,28
4294967293,27
4294967293,26
4294967293,25
4294967293,24
4294967293,23
4294967293,22
4294967293,21
4294967293,20
4294967293,19
4294967293,18
4294967293,17
4294967293,16
4294967293,15
4294967293,14
4294967293,13
4294967293,12
4294967293,11
4294967293,10
4294967293,9
4294967293,8
4294967293,7
4294967293,6
4294967293,5
4294967293,4
4294967293,3
4294967293,2
4243767290,0
4243767289