import React from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../../../utils/format';

export interface DeliveryProof {
  id: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

interface DeliveryProofPhotosProps {
  proofs: DeliveryProof[];
  setPreviewUrl: (url: string | null) => void;
}

const DeliveryProofPhotos: React.FC<DeliveryProofPhotosProps> = ({ proofs, setPreviewUrl }) => {
  if (proofs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Camera className="w-4 h-4 text-green-500" />
        <h3 className="text-xs font-bold text-slate-400 uppercase">Chứng từ giao hàng</h3>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> {proofs.length} file
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setPreviewUrl(proof.fileUrl)}
          >
            {proof.fileType === 'image' ? (
              <img src={proof.fileUrl} alt={proof.fileName} className="w-full h-24 object-cover" />
            ) : (
              <video src={proof.fileUrl} className="w-full h-24 object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
              <p className="text-white text-[9px] font-bold truncate">{proof.uploadedBy} · {formatDateTime(proof.createdAt)}</p>
            </div>
            <div className="absolute top-1 left-1">
              <span className={`px-1 py-0.5 text-[8px] font-bold rounded-full ${
                proof.fileType === 'video' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {proof.fileType === 'video' ? '🎥' : '📷'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveryProofPhotos;
