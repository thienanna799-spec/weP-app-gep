import React from 'react';
import { Image, CreditCard, AlertTriangle, ZoomIn } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import { Driver } from '../../types';

interface PhotoItem {
  label: string;
  src: string;
}

// ── Photo Thumbnail Card ──
const PhotoThumb: React.FC<{
  label: string;
  sublabel: string;
  src?: string;
  onClick: () => void;
}> = ({ label, sublabel, src, onClick }) => {
  if (!src) {
    return (
      <div className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
        <AlertTriangle className="w-5 h-5 text-slate-300 mb-1" />
        <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-[8px] text-slate-300">{sublabel}</p>
        <p className="text-[8px] text-amber-400 mt-1">Chưa có ảnh</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group relative h-28 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all cursor-pointer"
    >
      <img src={src} alt={label} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
        <div>
          <p className="text-[9px] font-bold text-white uppercase">{label}</p>
          <p className="text-[8px] text-white/70">{sublabel}</p>
        </div>
        <ZoomIn className="w-4 h-4 text-white/80" />
      </div>
    </button>
  );
};

interface DriverDocumentsCardProps {
  driver: Driver;
  allPhotos: PhotoItem[];
  onOpenLightbox: (src: string) => void;
}

export const DriverDocumentsCard: React.FC<DriverDocumentsCardProps> = ({
  driver,
  allPhotos,
  onOpenLightbox,
}) => {
  const hasAnyPhoto = allPhotos.length > 0;

  return (
    <Card className="p-4 bg-slate-50 border-none">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Image className="w-3 h-3" /> Giấy tờ tài xế
        {hasAnyPhoto && (
          <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full ml-auto">
            {allPhotos.length} ảnh · Click để xem
          </span>
        )}
      </h4>

      {/* CCCD Row */}
      <div className="mb-3">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CreditCard className="w-3 h-3" /> CCCD / Căn cước công dân
        </p>
        <div className="grid grid-cols-2 gap-3">
          <PhotoThumb 
            label="Mặt trước" sublabel="CCCD Front" 
            src={driver.idCardPhoto} 
            onClick={() => driver.idCardPhoto && onOpenLightbox(driver.idCardPhoto)} 
          />
          <PhotoThumb 
            label="Mặt sau" sublabel="CCCD Back" 
            src={driver.idCardPhotoBack} 
            onClick={() => driver.idCardPhotoBack && onOpenLightbox(driver.idCardPhotoBack)} 
          />
        </div>
      </div>

      {/* GPLX Row */}
      <div>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CreditCard className="w-3 h-3" /> GPLX / Giấy phép lái xe
        </p>
        <div className="grid grid-cols-2 gap-3">
          <PhotoThumb 
            label="Mặt trước" sublabel="GPLX Front" 
            src={driver.licensePhoto} 
            onClick={() => driver.licensePhoto && onOpenLightbox(driver.licensePhoto)} 
          />
          <PhotoThumb 
            label="Mặt sau" sublabel="GPLX Back" 
            src={driver.licensePhotoBack} 
            onClick={() => driver.licensePhotoBack && onOpenLightbox(driver.licensePhotoBack)} 
          />
        </div>
      </div>

      {!hasAnyPhoto && (
        <div className="mt-3 text-center py-4 bg-amber-50 rounded-xl border border-amber-100">
          <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-xs font-bold text-amber-700">Chưa có ảnh giấy tờ</p>
          <p className="text-[10px] text-amber-500 mt-0.5">Tài xế cần tải lên từ ứng dụng DriverGo</p>
        </div>
      )}
    </Card>
  );
};
