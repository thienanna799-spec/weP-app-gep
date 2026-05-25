import React from 'react';
import { X } from 'lucide-react';

interface FullscreenPreviewProps {
  previewUrl: string | null;
  setPreviewUrl: (url: string | null) => void;
}

const FullscreenPreview: React.FC<FullscreenPreviewProps> = ({ previewUrl, setPreviewUrl }) => {
  if (!previewUrl) return null;

  return (
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
  );
};

export default FullscreenPreview;
