import React from 'react';
import { Material, MaterialStatus } from '../types';
import Badge from '../../../components/ui/Badge';

interface ImageLightboxProps {
  material: Material | null;
  onClose: () => void;
}

const statusBadge = (status: MaterialStatus) => {
  switch (status) {
    case 'còn hàng': return <Badge variant="green">Còn hàng</Badge>;
    case 'sắp hết': return <Badge variant="yellow">Sắp hết</Badge>;
    case 'hết hàng': return <Badge variant="red">Hết hàng</Badge>;
    case 'ngừng sử dụng': return <Badge variant="gray">Ngừng dùng</Badge>;
    default: return <Badge variant="gray">{status}</Badge>;
  }
};

const ImageLightbox: React.FC<ImageLightboxProps> = ({ material, onClose }) => {
  if (!material || !material.imageUrl) return null;
  const m = material;
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full mx-4 flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-2xl animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeScaleIn 0.25s ease-out' }}
      >
        {/* Image Section */}
        <div className="md:w-2/3 bg-slate-900 flex items-center justify-center min-h-[300px] max-h-[70vh]">
          <img
            src={m.imageUrl}
            alt={m.name}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Info Panel */}
        <div className="md:w-1/3 p-6 flex flex-col gap-4 bg-white">
          <div>
            <p className="text-xs font-mono text-slate-400 mb-1">{m.code}</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{m.name}</h3>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">📦</div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase">Nhóm</p>
                <p className="text-sm font-bold text-blue-900">{m.group}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-xs font-bold">📊</div>
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Tồn kho</p>
                <p className="text-sm font-bold text-emerald-900">{m.currentStock} {m.unit}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-xs font-bold">🏭</div>
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase">Nhà cung cấp</p>
                <p className="text-sm font-bold text-amber-900">{m.supplier || '---'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 text-xs font-bold">📍</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Vị trí kho</p>
                <p className="text-sm font-bold text-slate-900">{m.warehouseLocation || '---'}</p>
              </div>
            </div>

            <div className="pt-2">
              {statusBadge(m.status)}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>

        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors text-lg font-bold"
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ImageLightbox;
