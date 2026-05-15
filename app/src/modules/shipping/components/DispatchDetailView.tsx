/**
 * DispatchDetailView — Right panel: order detail + actions
 */

import React from 'react';
import {
  Loader2, MapPin, CheckCircle2, XCircle, Clock, X, FileText,
  PackageSearch, PackageCheck, ArrowRight, Download,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../services/orderFlowService';

import DeliveryMap from './DeliveryMap';
import DeliveryTimeline from './DeliveryTimeline';
import DriverInfoCard from './DriverInfoCard';
import DeliveryProofUpload from './DeliveryProofUpload';
import { DetailItems, DriverAssignForm } from './DispatchDetailPanels';

interface Props {
  selectedOrder: any;
  trackingData: any;
  detailLoading: boolean;
  drivers: any[];
  hasProofs: boolean;
  downloadingProofs: boolean;
  // Driver form
  driverName: string; setDriverName: (v: string) => void;
  vehicle: string; setVehicle: (v: string) => void;
  deadline: string; setDeadline: (v: string) => void;
  assignLoading: boolean;
  setDriverId: (id: string | null) => void;
  // Callbacks
  onClose: () => void;
  onOpenInvoice: (order: any) => void;
  onOpenPickingSlip: (order: any) => void;
  onAssignDriver: () => void;
  onCompleteDelivery: () => void;
  onFailDelivery: () => void;
  onUpdateStatus: (status: string, confirmMsg: string) => void;
  onDownloadProofs: () => void;
  onProofsChange: (has: boolean) => void;
}

const DispatchDetailView: React.FC<Props> = ({
  selectedOrder, trackingData, detailLoading, drivers,
  hasProofs, downloadingProofs,
  driverName, setDriverName, vehicle, setVehicle,
  deadline, setDeadline, assignLoading, setDriverId,
  onClose, onOpenInvoice, onOpenPickingSlip,
  onAssignDriver, onCompleteDelivery, onFailDelivery,
  onUpdateStatus, onDownloadProofs, onProofsChange,
}) => {
  const { t } = useTranslation();

  if (detailLoading) {
    return (
      <Card className="w-[70%] flex flex-col overflow-hidden shadow-xl border-slate-200/60">
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      </Card>
    );
  }

  if (!selectedOrder) return null;

  const getStatusBadge = (status: string) => (
    <Badge variant={(ORDER_STATUS_COLORS[status] || 'gray') as any}>{ORDER_STATUS_LABELS[status] || status}</Badge>
  );

  return (
    <Card className="w-[70%] flex flex-col overflow-hidden shadow-xl border-slate-200/60">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-black text-slate-900">{t('shipping.order_prefix')} #{selectedOrder.code}</h3>
              {getStatusBadge(selectedOrder.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>{selectedOrder.customerName}</span>
              {selectedOrder.customerPhone && <span className="font-mono text-slate-400">{selectedOrder.customerPhone}</span>}
            </div>
            {selectedOrder.customerAddress && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedOrder.customerAddress}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={() => onOpenInvoice(selectedOrder)}>
              <FileText className="w-3.5 h-3.5" />{t('shipping.delivery_slip')}
            </Button>
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => onOpenPickingSlip(selectedOrder)}>
              <PackageSearch className="w-3.5 h-3.5" />Phiếu lấy hàng
            </Button>
            {selectedOrder.status === 'hoan_thanh' && (
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50" onClick={onDownloadProofs} disabled={downloadingProofs}>
                {downloadingProofs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Tải chứng từ
              </Button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          <DetailItems items={selectedOrder.items} />
          <DeliveryProofUpload orderId={selectedOrder.id} orderStatus={selectedOrder.status} onProofsChange={onProofsChange} />

          {/* Tracking view */}
          {trackingData && ['da_ban_giao_tai_xe', 'dang_giao', 'giao_thanh_cong', 'giao_that_bai'].includes(trackingData.status) && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ minHeight: 350 }}>
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> {t('shipping.delivery_map')}</h4>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  </div>
                  <DeliveryMap deliveryLogs={trackingData.deliveryLogs || []} gpsLogs={trackingData.gpsLogs || []} driverName={trackingData.assignedDriverName} vehiclePlate={trackingData.assignedVehicle} className="h-[320px]" />
                </div>
                <div className="xl:col-span-2 space-y-4">
                  <DriverInfoCard driver={trackingData.driver} vehicle={trackingData.assignedVehicle} shippedAt={trackingData.shippedAt} deliveryDeadline={trackingData.deliveryDeadline} />
                  {selectedOrder.status === 'dang_giao' && (
                    <div className="flex gap-2">
                      <Button onClick={onCompleteDelivery} disabled={!hasProofs} className={`flex-1 gap-1.5 text-sm ${hasProofs ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                        <CheckCircle2 className="w-4 h-4" />{t('shipping.delivery_success')}
                      </Button>
                      <Button onClick={onFailDelivery} variant="secondary" className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 gap-1.5 text-sm">
                        <XCircle className="w-4 h-4" />{t('shipping.delivery_failed')}
                      </Button>
                    </div>
                  )}
                  {selectedOrder.status === 'dang_giao' && !hasProofs && (
                    <p className="text-[10px] text-amber-600 font-medium text-center mt-1">⚠ Upload chứng từ bên dưới trước khi hoàn thành</p>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <DeliveryTimeline status={trackingData.status} deliveryLogs={trackingData.deliveryLogs || []} createdAt={trackingData.createdAt} shippedAt={trackingData.shippedAt} deliveredAt={trackingData.deliveredAt} failedAt={trackingData.failedAt} failReason={trackingData.failReason} />
              </div>
              <DeliveryProofUpload orderId={selectedOrder.id} orderStatus={selectedOrder.status} onProofsChange={onProofsChange} />
            </>
          )}

          {/* CHỜ XUẤT KHO */}
          {selectedOrder.status === 'cho_xuat_kho' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center text-xs font-black">1</div>
                  <h4 className="text-sm font-bold text-green-800">Tự xác nhận giao hàng (trên máy tính)</h4>
                </div>
                <p className="text-xs text-green-700 pl-9">Upload ảnh/video chứng từ ở phần bên trên, sau đó nhấn nút bên dưới để hoàn thành đơn hàng.</p>
                <div className="pl-9">
                  <Button onClick={() => onUpdateStatus('hoan_thanh', 'Xác nhận đã giao hàng thành công? (Đảm bảo đã upload chứng từ)')} disabled={!hasProofs} className={`gap-1.5 text-sm w-full ${hasProofs ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Xác nhận giao hàng thành công
                  </Button>
                  {!hasProofs && <p className="text-[10px] text-amber-600 font-medium text-center mt-1.5">⚠ Cần upload ít nhất 1 ảnh chứng từ trước khi xác nhận</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" /><span className="text-xs font-bold text-slate-400 uppercase">Hoặc</span><div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</div>
                  <h4 className="text-sm font-bold text-blue-800">Gán tài xế giao hàng (qua App)</h4>
                </div>
                <p className="text-xs text-blue-700 pl-9">Tài xế sẽ nhận đơn trên app APK, tự upload ảnh chứng từ và xác nhận giao hàng.</p>
                <div className="pl-9">
                  <DriverAssignForm drivers={drivers} driverName={driverName} vehicle={vehicle} deadline={deadline} setDriverName={setDriverName} setVehicle={setVehicle} setDeadline={setDeadline} onAssign={onAssignDriver} loading={assignLoading} onDriverSelect={(id: string | null) => setDriverId(id)} />
                </div>
              </div>
            </div>
          )}

          {/* WAITING STATUS */}
          {['da_duyet', 'dang_chuan_bi'].includes(selectedOrder.status) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-blue-800">
                  {selectedOrder.status === 'da_duyet' ? t('shipping.order_approved_waiting') : t('shipping.picking_in_progress')}
                </h4>
              </div>
              <p className="text-xs text-blue-700">
                {selectedOrder.status === 'da_duyet' ? t('shipping.approved_desc') : t('shipping.picking_desc')}
              </p>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-200">
                {selectedOrder.status === 'da_duyet' && (
                  <Button onClick={() => onUpdateStatus('dang_chuan_bi', 'Bắt đầu soạn hàng cho đơn này?')} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-sm">
                    <PackageSearch className="w-4 h-4" /> Bắt đầu soạn hàng <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
                {selectedOrder.status === 'dang_chuan_bi' && (
                  <Button onClick={() => onUpdateStatus('cho_xuat_kho', 'Xác nhận đã soạn hàng xong?')} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-sm">
                    <PackageCheck className="w-4 h-4" /> Soạn hàng xong <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* COMPLETED */}
          {selectedOrder.status === 'hoan_thanh' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-bold text-green-800">{t('shipping.order_completed')}</p>
              </div>
              {trackingData && (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <DeliveryTimeline status={trackingData.status} deliveryLogs={trackingData.deliveryLogs || []} createdAt={trackingData.createdAt} deliveredAt={trackingData.deliveredAt} />
                  </div>
                  <DeliveryProofUpload orderId={selectedOrder.id} orderStatus={selectedOrder.status} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DispatchDetailView;
