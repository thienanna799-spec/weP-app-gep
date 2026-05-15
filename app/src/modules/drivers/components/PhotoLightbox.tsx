import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface PhotoLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ src, alt, onClose }) => {
  const [zoom, setZoom] = React.useState(1);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Zoom controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 hover:bg-white transition-colors shadow-lg"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="w-14 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-xs font-bold text-slate-700 shadow-lg">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-slate-600 hover:bg-white transition-colors shadow-lg"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        <img
          src={src}
          alt={alt || 'Photo'}
          className="rounded-2xl shadow-2xl object-contain max-h-[85vh] transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />

        {/* Label */}
        {alt && (
          <p className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur">
            {alt}
          </p>
        )}
      </div>
    </div>
  );
};

export default PhotoLightbox;

// ── Multi-photo gallery lightbox (used by DriverDetail) ──
interface PhotoItem {
  label: string;
  src: string;
}

export const PhotoLightboxGallery: React.FC<{
  photos: PhotoItem[];
  initialIndex: number;
  onClose: () => void;
}> = ({ photos, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const current = photos[currentIndex];

  const goNext = () => setCurrentIndex(i => (i + 1) % photos.length);
  const goPrev = () => setCurrentIndex(i => (i - 1 + photos.length) % photos.length);

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-4 px-2">
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-xs font-mono">{currentIndex + 1}/{photos.length}</span>
            <span className="text-white font-bold text-sm">{current.label}</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div className="relative">
          <img 
            src={current.src} 
            alt={current.label} 
            className="max-w-[85vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
          
          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button 
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                ‹
              </button>
              <button 
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-2 mt-4">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentIndex 
                    ? 'border-blue-500 shadow-lg shadow-blue-500/30 scale-110' 
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p.src} alt={p.label} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
