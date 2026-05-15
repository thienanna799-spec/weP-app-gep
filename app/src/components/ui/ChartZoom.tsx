import React, { useState, useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';

interface ChartZoomProps {
  title: string;
  children: React.ReactNode;
  height?: string;
}

/**
 * Wraps any Recharts chart. Adds a zoom icon on hover.
 * On click, opens a fullscreen modal with the chart rendered larger.
 *
 * FIX (EVT-2026-05-13-013):
 * ResponsiveContainer uses offsetHeight to measure parent. If parent height
 * comes from CSS flex classes (h-[70vh]), the measurement can return 0 during
 * initial mount animation. Solution:
 * 1. Use explicit inline style height on modal chart container (not CSS class)
 * 2. Delay chart render by 1 tick (useEffect + mounted flag) so DOM is settled
 * 3. Add unique key={title} to force fresh Recharts mount in modal
 */
const ChartZoom: React.FC<ChartZoomProps> = ({ title, children, height = '100%' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);

  // Delay rendering chart inside modal by 1 frame so DOM dimensions are settled
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setModalMounted(true), 50);
      return () => clearTimeout(t);
    } else {
      setModalMounted(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Normal view — clickable */}
      <div
        className="relative group cursor-pointer"
        style={{ height }}
        onClick={() => setIsOpen(true)}
        title="Click để phóng to"
      >
        {/* Hide original chart when modal is open to avoid duplicate ID/ResizeObserver glitches */}
        {!isOpen ? children : <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-sm">Đang phóng to...</div>}
        
        {/* Zoom overlay on hover */}
        {!isOpen && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 rounded-xl pointer-events-none flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold text-indigo-600 border border-indigo-100">
              <Maximize2 className="w-3.5 h-3.5" /> Phóng to
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Content */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] flex flex-col"
            style={{ height: '88vh', animation: 'chartZoomIn 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                📊 {title}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chart — explicit pixel height so ResponsiveContainer can measure correctly */}
            <div
              className="w-full p-6"
              style={{ height: 'calc(88vh - 73px)' }}
            >
              {/* key={title} forces a fresh Recharts mount instead of reusing the background instance */}
              {/* Only render after modalMounted=true so DOM layout is settled (offsetHeight > 0) */}
              {modalMounted
                ? <div key={title} style={{ width: '100%', height: '100%' }}>{children}</div>
                : <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes chartZoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default ChartZoom;
