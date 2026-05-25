import React, { useState, useEffect } from 'react';
import { History, RefreshCw, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';
import { Driver, Vehicle } from '../types';

// Sub-components
import { DriverProfileCard } from './driver-detail/DriverProfileCard';
import { DriverInfoCards } from './driver-detail/DriverInfoCards';
import { DriverDocumentsCard } from './driver-detail/DriverDocumentsCard';

// Lightbox from shared component
import { PhotoLightboxGallery } from './PhotoLightbox';

interface PhotoItem {
  label: string;
  src: string;
}

interface ShippingOrder {
  id: string;
  code: string;
  status: string;
  customerName: string;
  deliveredAt?: string;
  failedAt?: string;
  createdAt: string;
}

interface DriverStats {
  totalDeliveries: number;
  successDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  totalFuelCost: number;
  lastGpsTimestamp: string | null;
}

interface DriverDetailProps {
  driver: Driver;
  vehicle?: Vehicle;
  onClose: () => void;
}

export const DriverDetail: React.FC<DriverDetailProps> = ({ driver, vehicle, onClose }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [recentShipping, setRecentShipping] = useState<ShippingOrder[]>([]);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ✅ Fix BUG 2 & 3: Fetch REAL delivery history and stats
  useEffect(() => {
    setLoadingHistory(true);
    Promise.all([
      api.get<ShippingOrder[]>(`/shipping?driverId=${driver.id}`).catch(() => []),
      api.get<DriverStats>(`/drivers/${driver.id}/stats`).catch(() => null),
    ]).then(([shipping, stats]) => {
      setRecentShipping((shipping || []).slice(0, 5));
      setDriverStats(stats);
    }).finally(() => setLoadingHistory(false));
  }, [driver.id]);

  // Build photo list for lightbox
  const allPhotos: PhotoItem[] = [];
  const realAvatar = driver.avatar && !driver.avatar.includes('ui-avatars.com') ? driver.avatar : undefined;
  if (realAvatar) allPhotos.push({ label: 'Ảnh chân dung', src: realAvatar });
  if (driver.idCardPhoto) allPhotos.push({ label: 'CCCD — Mặt trước', src: driver.idCardPhoto });
  if (driver.idCardPhotoBack) allPhotos.push({ label: 'CCCD — Mặt sau', src: driver.idCardPhotoBack });
  if (driver.licensePhoto) allPhotos.push({ label: 'GPLX — Mặt trước', src: driver.licensePhoto });
  if (driver.licensePhotoBack) allPhotos.push({ label: 'GPLX — Mặt sau', src: driver.licensePhotoBack });

  const openLightbox = (src: string) => {
    const idx = allPhotos.findIndex(p => p.src === src);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  const statusMap: Record<string, { label: string; variant: 'green' | 'blue' | 'red' | 'yellow' }> = {
    giao_thanh_cong: { label: 'Thành công', variant: 'green' },
    dang_giao: { label: 'Đang giao', variant: 'blue' },
    giao_that_bai: { label: 'Thất bại', variant: 'red' },
  };

  return (
    <div className="space-y-6">
      {/* Lightbox */}
      {lightboxIndex !== null && allPhotos.length > 0 && (
        <PhotoLightboxGallery 
          photos={allPhotos} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Avatar & Basic Info */}
        <DriverProfileCard driver={driver} />

        {/* Right: Detailed info */}
        <div className="flex-1 space-y-6">
          <DriverInfoCards driver={driver} vehicle={vehicle} driverStats={driverStats} />
          
          {/* Fraud Analytics Widget */}
          <Card className="p-4 bg-slate-50 border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Phân tích Gian lận OCR (Trust Score)
            </h4>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-4 rounded-full bg-white shadow-sm border border-slate-100 w-24 h-24 shrink-0">
                <span className={`text-3xl font-black ${
                  (driver.trustScore ?? 100) >= 90 ? 'text-emerald-500' : 
                  (driver.trustScore ?? 100) >= 70 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {driver.trustScore ?? 100}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Điểm uy tín</span>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-2 text-rose-600">
                     <AlertTriangle className="w-4 h-4" />
                     <span className="text-xs font-bold">Trùng lặp Hóa đơn</span>
                   </div>
                   <span className="text-xs font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded">{driver.fraudFlags?.duplicates ?? 0} lần</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-2 text-amber-600">
                     <AlertTriangle className="w-4 h-4" />
                     <span className="text-xs font-bold">Khai khống bị từ chối</span>
                   </div>
                   <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{driver.fraudFlags?.rejected ?? 0} lần</span>
                </div>
              </div>
            </div>
          </Card>

          <DriverDocumentsCard driver={driver} allPhotos={allPhotos} onOpenLightbox={openLightbox} />

          <Card className="p-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2"><History className="w-3 h-3" /> Lịch sử giao hàng gần đây</span>
            </h4>
            <div className="space-y-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Đang tải...</span>
                </div>
              ) : recentShipping.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Chưa có lịch sử giao hàng</p>
              ) : recentShipping.map(s => {
                const info = statusMap[s.status] || { label: s.status, variant: 'yellow' as const };
                const date = s.deliveredAt || s.failedAt || s.createdAt;
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3 text-xs">
                      <div className={`w-2 h-2 rounded-full ${info.variant === 'green' ? 'bg-emerald-500' : info.variant === 'red' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="font-bold text-slate-900">{s.code}</p>
                        <p className="text-[10px] text-slate-400">{new Date(date).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <Badge variant={info.variant}>{info.label}</Badge>
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
