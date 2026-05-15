import React from 'react';
import { Image, FileSignature } from 'lucide-react';

interface ProofOfDeliveryProps {
  deliveryLogs: any[];
  deliveredAt?: string;
}

const ProofOfDelivery: React.FC<ProofOfDeliveryProps> = ({ deliveryLogs, deliveredAt }) => {
  const images = deliveryLogs.filter((log: any) => log.imageUrl).map((log: any) => ({
    url: log.imageUrl,
    action: log.action,
    time: log.createdAt,
  }));
  const signatures = deliveryLogs.filter((log: any) => log.signatureUrl).map((log: any) => ({
    url: log.signatureUrl,
    time: log.createdAt,
  }));

  if (images.length === 0 && signatures.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center">
        <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400 font-medium">Chưa có ảnh chứng minh giao hàng</p>
        <p className="text-[10px] text-slate-300 mt-1">Tài xế sẽ gửi ảnh khi giao hàng xong</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Delivery Images */}
      {images.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" /> Ảnh giao hàng ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img: any, idx: number) => (
              <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.open(img.url, '_blank')}>
                <img src={img.url} alt={img.action} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div>
                    <p className="text-white text-[10px] font-bold">{img.action}</p>
                    <p className="text-white/70 text-[9px]">{new Date(img.time).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      {signatures.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileSignature className="w-3.5 h-3.5" /> Chữ ký khách hàng
          </h4>
          <div className="flex gap-3">
            {signatures.map((sig: any, idx: number) => (
              <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <img src={sig.url} alt="Chữ ký" className="h-20 object-contain" />
                <p className="text-[9px] text-slate-400 mt-1 text-center">{new Date(sig.time).toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofOfDelivery;
