/**
 * DeliveryProofUpload — Upload images/videos as delivery proof.
 * Required before completing an order.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Trash2, Upload, Image, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';

interface DeliveryProof {
  id: string;
  fileType: string;
  fileName: string;
  fileUrl: string;
  note?: string;
  uploadedBy: string;
  createdAt: string;
}

interface DeliveryProofUploadProps {
  orderId: string;
  orderStatus: string;
  onProofsChange?: (hasProofs: boolean) => void;
}

const DeliveryProofUpload: React.FC<DeliveryProofUploadProps> = ({
  orderId, orderStatus, onProofsChange,
}) => {
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const data = await api.get<DeliveryProof[]>(`/orders/${orderId}/delivery-proofs`);
      setProofs(data);
      onProofsChange?.(data.length > 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (orderId) fetchProofs();
  }, [orderId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files) as File[]) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        if (!isImage && !isVideo) {
          alert(`File "${file.name}" không phải ảnh hoặc video`);
          continue;
        }

        // Check size: max 5MB for images, 20MB for videos
        const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
          alert(`File "${file.name}" quá lớn. Giới hạn: ${isVideo ? '20MB' : '5MB'}`);
          continue;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);

        await api.post(`/orders/${orderId}/delivery-proofs`, {
          fileType: isVideo ? 'video' : 'image',
          fileName: file.name,
          fileUrl: base64,
        });
      }
      await fetchProofs();
    } catch (err: any) {
      alert(err.message || 'Lỗi upload chứng từ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (proofId: string) => {
    if (!confirm('Xóa chứng từ này?')) return;
    try {
      await api.delete(`/orders/${orderId}/delivery-proofs/${proofId}`);
      await fetchProofs();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa chứng từ');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload only when: soạn hàng xong (cho_xuat_kho) or đang giao (dang_giao, da_ban_giao_tai_xe)
  const canUpload = ['cho_xuat_kho', 'da_ban_giao_tai_xe', 'dang_giao'].includes(orderStatus);
  // Show component only when relevant (not for early stages like da_duyet, dang_chuan_bi)
  const showSection = ['cho_xuat_kho', 'da_ban_giao_tai_xe', 'dang_giao', 'giao_thanh_cong', 'hoan_thanh'].includes(orderStatus);

  if (!showSection) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold text-amber-800">Chứng từ giao hàng</h4>
          {proofs.length > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {proofs.length} file
            </span>
          )}
        </div>
        {proofs.length === 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Bắt buộc
          </span>
        )}
      </div>

      {/* Upload area */}
      {canUpload && (
        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id={`proof-upload-${orderId}`}
          />
          <label
            htmlFor={`proof-upload-${orderId}`}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all
              ${uploading ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'}`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                <p className="text-sm font-medium text-amber-600">Đang upload...</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Image className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-700">Nhấn để upload ảnh / video chứng từ</p>
                <p className="text-[10px] text-slate-400 mt-1">Ảnh tối đa 5MB · Video tối đa 20MB · Hỗ trợ JPG, PNG, MP4</p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Proofs gallery */}
      {loading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : proofs.length > 0 ? (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {proofs.map((proof) => (
              <div key={proof.id} className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                {proof.fileType === 'image' ? (
                  <img
                    src={proof.fileUrl}
                    alt={proof.fileName}
                    className="w-full h-28 object-cover cursor-pointer"
                    onClick={() => setPreviewUrl(proof.fileUrl)}
                  />
                ) : (
                  <video
                    src={proof.fileUrl}
                    className="w-full h-28 object-cover cursor-pointer"
                    onClick={() => setPreviewUrl(proof.fileUrl)}
                  />
                )}
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div className="flex-1">
                    <p className="text-white text-[10px] font-bold truncate">{proof.fileName}</p>
                    <p className="text-white/60 text-[9px]">{proof.uploadedBy} · {new Date(proof.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  {canUpload && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(proof.id); }}
                      className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {/* File type badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                    proof.fileType === 'video' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {proof.fileType === 'video' ? '🎥 Video' : '📷 Ảnh'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !canUpload ? (
        <div className="p-6 text-center text-sm text-slate-400 italic">
          Chưa có chứng từ giao hàng
        </div>
      ) : null}

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {previewUrl.startsWith('data:video') ? (
            <video src={previewUrl} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryProofUpload;
