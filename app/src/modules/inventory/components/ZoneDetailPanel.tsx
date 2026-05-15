import React from 'react';
import { WAREHOUSE, STATUS_COLORS, WarehouseRoll } from './warehouseConfig';

interface ZoneDetailPanelProps {
  selectedZone: string;
  onClose: () => void;
  zoneStats: Record<string, { total: number; inStock: number; reserved: number; defective: number }>;
  rolls: WarehouseRoll[];
  onRollClick?: (roll: WarehouseRoll) => void;
}

const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({ selectedZone, onClose, zoneStats, rolls, onRollClick }) => {
  const zone = WAREHOUSE.zones.find(z => z.id === selectedZone);
  const stats = zoneStats[selectedZone];
  const zoneRolls = rolls.filter(r => (r.positionArea || '').includes(selectedZone));
  if (!zone) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-8 rounded-full" style={{ backgroundColor: zone.color }} />
          <div>
            <h3 className="font-bold text-slate-900">{zone.name}</h3>
            <p className="text-xs text-slate-400">{zone.w}m × {zone.h}m = {zone.w * zone.h}m² · {zone.shelves} kệ hàng</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <p className="text-lg font-black text-slate-900">{stats.total}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng cuộn</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-lg font-black text-green-600">{stats.inStock}</p>
          <p className="text-[10px] text-green-500 font-bold uppercase">Trong kho</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <p className="text-lg font-black text-blue-600">{stats.reserved}</p>
          <p className="text-[10px] text-blue-500 font-bold uppercase">Đã giữ</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-xl">
          <p className="text-lg font-black text-red-600">{stats.defective}</p>
          <p className="text-[10px] text-red-500 font-bold uppercase">Lỗi</p>
        </div>
      </div>
      {zoneRolls.length > 0 && (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {zoneRolls.map(roll => (
            <div
              key={roll.id}
              onClick={() => onRollClick?.(roll)}
              className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[roll.status]?.bg || '#94a3b8' }} />
                <span className="text-xs font-bold text-slate-700">{roll.code}</span>
                <span className="text-[10px] text-slate-400">{roll.productName}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {roll.positionShelf && `Kệ ${roll.positionShelf}`} {roll.positionSlot && `· Ô ${roll.positionSlot}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZoneDetailPanel;
