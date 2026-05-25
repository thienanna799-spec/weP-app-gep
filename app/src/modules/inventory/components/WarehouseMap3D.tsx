/**
 * WarehouseMap3D – Interactive 3D warehouse visualization
 * ─────────────────────────────────────────────────────────
 * Renders an isometric 3D view of the warehouse (10m x 50m = 500m²)
 * with shelving zones, roll positions, and status indicators.
 */

import React, { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { WAREHOUSE, STATUS_COLORS, WarehouseRoll } from './warehouseConfig';
import ZoneDetailPanel from './ZoneDetailPanel';

interface Props {
  rolls: WarehouseRoll[];
  onRollClick?: (roll: WarehouseRoll) => void;
}

const WarehouseMap3D: React.FC<Props> = ({ rolls, onRollClick }) => {
  const [zoom, setZoom] = useState(1);
  const [rotateX, setRotateX] = useState(55);
  const [rotateZ, setRotateZ] = useState(-35);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [warehouseConfig, setWarehouseConfig] = useState(WAREHOUSE);

  // Sync with localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('gep_warehouse_config');
      if (saved) {
        try {
          setWarehouseConfig(JSON.parse(saved));
        } catch (e) {}
      }
    };
    handleStorageChange(); // init
    window.addEventListener('storage', handleStorageChange);
    // Custom event dispatch inside StorageAreaManagement
    window.addEventListener('warehouse_config_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('warehouse_config_updated', handleStorageChange);
    };
  }, []);

  const zoneStats = useMemo(() => {
    const stats: Record<string, { total: number; inStock: number; reserved: number; defective: number }> = {};
    warehouseConfig.zones.forEach(z => {
      const zoneRolls = rolls.filter(r => (r.positionArea || '').includes(z.id));
      stats[z.id] = {
        total: zoneRolls.length,
        inStock: zoneRolls.filter(r => r.status === 'trong_kho').length,
        reserved: zoneRolls.filter(r => r.status === 'da_giu_cho_don').length,
        defective: zoneRolls.filter(r => r.status === 'loi_hong').length,
      };
    });
    return stats;
  }, [rolls, warehouseConfig.zones]);

  const scale = 14 * zoom;
  const handleMouseDown = (e: React.MouseEvent) => { if (e.button === 0) { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); } };
  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) { setRotateZ(prev => prev + (e.clientX - dragStart.x) * 0.3); setRotateX(prev => Math.max(20, Math.min(80, prev - (e.clientY - dragStart.y) * 0.3))); setDragStart({ x: e.clientX, y: e.clientY }); } };
  const handleMouseUp = () => setIsDragging(false);
  const resetView = () => { setRotateX(55); setRotateZ(-35); setZoom(1); setSelectedZone(null); };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-mono font-bold text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><ZoomIn className="w-4 h-4" /></button>
          </div>
          <button onClick={resetView} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-colors" title="Reset view"><RotateCcw className="w-4 h-4" /></button>
          <span className="text-[10px] text-slate-400 font-medium">Kéo chuột để xoay · Cuộn để zoom</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(STATUS_COLORS).slice(0, 3).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: val.bg }} />
              <span className="text-slate-500 font-medium">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Scene */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700" style={{ height: '520px', perspective: '1200px' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={(e) => setZoom(z => Math.max(0.5, Math.min(2, z + (e.deltaY > 0 ? -0.08 : 0.08))))}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
          <p className="text-white font-bold text-sm">Sơ đồ Kho hàng 3D</p>
          <p className="text-slate-400 text-[10px] font-mono">10m × 50m = 500m² · {rolls.length} cuộn</p>
        </div>
        <div className="absolute top-4 right-4 z-20 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center">
          <div className="text-[10px] font-bold text-white" style={{ transform: `rotate(${rotateZ + 35}deg)` }}><span className="text-red-400">N</span></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center" style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          <div style={{ transformStyle: 'preserve-3d', transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${zoom})`, transition: isDragging ? 'none' : 'transform 0.3s ease-out' }}>
            <div style={{ width: `${warehouseConfig.width * scale}px`, height: `${warehouseConfig.length * scale}px`, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', border: '2px solid #475569', borderRadius: '4px', position: 'relative', transformStyle: 'preserve-3d', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              {/* Floor grid */}
              {Array.from({ length: Math.floor(warehouseConfig.length / 2) }).map((_, i) => (<div key={`h${i}`} style={{ position: 'absolute', top: `${i * 2 * scale}px`, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.03)' }} />))}
              {Array.from({ length: Math.floor(warehouseConfig.width / 2) }).map((_, i) => (<div key={`v${i}`} style={{ position: 'absolute', left: `${i * 2 * scale}px`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.03)' }} />))}

              {/* Aisle */}
              <div style={{ position: 'absolute', left: `${4.2 * scale}px`, top: 0, width: `${1.6 * scale}px`, height: `${warehouseConfig.length * scale}px`, background: 'repeating-linear-gradient(0deg, rgba(234,179,8,0.15) 0px, rgba(234,179,8,0.15) 8px, transparent 8px, transparent 16px)', borderLeft: '1px dashed rgba(234,179,8,0.3)', borderRight: '1px dashed rgba(234,179,8,0.3)' }} />

              {/* Zones */}
              {warehouseConfig.zones.map(zone => {
                const isHovered = hoveredZone === zone.id;
                const isSelected = selectedZone === zone.id;
                return (
                  <div key={zone.id} style={{ position: 'absolute', left: `${zone.x * scale}px`, top: `${zone.y * scale}px`, width: `${zone.w * scale}px`, height: `${zone.h * scale}px`, transformStyle: 'preserve-3d' }}>
                    <div onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)} onMouseEnter={() => setHoveredZone(zone.id)} onMouseLeave={() => setHoveredZone(null)} style={{ width: '100%', height: '100%', background: `${zone.color}15`, border: `2px solid ${isHovered || isSelected ? zone.color : zone.color + '40'}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', boxShadow: isHovered || isSelected ? `0 0 20px ${zone.color}30, inset 0 0 30px ${zone.color}10` : 'none' }}>
                      <div style={{ position: 'absolute', top: '6px', left: '8px', fontSize: '10px', fontWeight: 800, color: zone.color, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{zone.name}</div>
                      <div style={{ position: 'absolute', bottom: '6px', right: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 700 }}>●{(zoneStats[zone.id] || {}).inStock || 0}</span>
                        <span style={{ fontSize: '9px', color: '#3b82f6', fontWeight: 700 }}>●{(zoneStats[zone.id] || {}).reserved || 0}</span>
                      </div>
                      {/* Shelves */}
                      {Array.from({ length: zone.shelves }).map((_, si) => {
                        const shelfX = si < zone.shelves / 2 ? 0.3 : 5.8;
                        const shelfY = 2 + (si % (zone.shelves / 2)) * ((zone.h - 3) / (zone.shelves / 2));
                        const shelfW = 3.8;
                        const shelfH = (zone.h - 4) / (zone.shelves / 2) - 0.5;
                        const shelfRolls = rolls.filter(r => (r.positionArea || '').includes(zone.id) && (r.positionShelf || '') === String(si + 1));
                        return (
                          <div key={si} style={{ position: 'absolute', left: `${shelfX * scale}px`, top: `${shelfY * scale}px`, width: `${shelfW * scale}px`, height: `${shelfH * scale}px`, transformStyle: 'preserve-3d' }}>
                            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', position: 'relative', transform: 'translateZ(2px)' }}>
                              <div style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '7px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Kệ {si + 1}</div>
                              <div style={{ position: 'absolute', bottom: '3px', left: '4px', right: '4px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                                {shelfRolls.slice(0, 8).map(roll => (<div key={roll.id} onClick={(e) => { e.stopPropagation(); onRollClick?.(roll); }} title={`${roll.code} - ${roll.productName}`} style={{ width: '8px', height: '8px', borderRadius: '2px', background: STATUS_COLORS[roll.status]?.bg || '#94a3b8', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.8)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')} />))}
                                {shelfRolls.length > 8 && <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)' }}>+{shelfRolls.length - 8}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(isHovered || isSelected) && (
                      <>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: `${zone.w * scale}px`, height: `${2 * scale}px`, background: `linear-gradient(0deg, ${zone.color}20, transparent)`, transformOrigin: 'bottom', transform: 'rotateX(-90deg)', borderTop: `1px solid ${zone.color}40` }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: `${2 * scale}px`, height: `${zone.h * scale}px`, background: `linear-gradient(90deg, ${zone.color}15, transparent)`, transformOrigin: 'left', transform: 'rotateY(90deg)', borderRight: `1px solid ${zone.color}30` }} />
                      </>
                    )}
                  </div>
                );
              })}

              {/* Facilities */}
              {warehouseConfig.facilities.map((f, i) => (
                <div key={i} style={{ position: 'absolute', left: `${f.x * scale}px`, top: `${(f.y + 2) * scale}px`, width: `${f.w * scale}px`, height: `${f.h * scale}px`, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '14px' }}>{f.icon}</span>
                  <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{f.name}</span>
                </div>
              ))}

              <div style={{ position: 'absolute', left: '50%', bottom: '-20px', transform: 'translateX(-50%)', fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 700, whiteSpace: 'nowrap' }}>← 10m →</div>
              <div style={{ position: 'absolute', right: '-28px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 700, whiteSpace: 'nowrap' }}>← 50m →</div>
            </div>
          </div>
        </div>
      </div>

      {selectedZone && <ZoneDetailPanel selectedZone={selectedZone} onClose={() => setSelectedZone(null)} zoneStats={zoneStats} rolls={rolls} onRollClick={onRollClick} />}
    </div>
  );
};

export default WarehouseMap3D;
