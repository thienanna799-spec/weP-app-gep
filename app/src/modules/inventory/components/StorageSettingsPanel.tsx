/**
 * StorageSettingsPanel — Warehouse config editor with zone CRUD
 * ──────────────────────────────────────────────────────────────
 * Extracted from StorageAreaManagement for maintainability.
 */

import React from 'react';
import { Settings2, Edit3, Save, X, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { WarehouseConfig, WarehouseZone } from './warehouseConfig';

interface StorageSettingsPanelProps {
  config: WarehouseConfig;
  editConfig: WarehouseConfig;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  onSave: () => void;
  onReset: () => void;
  onAddZone: () => void;
  onRemoveZone: (zoneId: string) => void;
  onUpdateZone: (zoneId: string, field: keyof WarehouseZone, value: any) => void;
  setEditConfig: React.Dispatch<React.SetStateAction<WarehouseConfig>>;
}

const StorageSettingsPanel: React.FC<StorageSettingsPanelProps> = ({
  config, editConfig, isEditing, setIsEditing,
  onSave, onReset, onAddZone, onRemoveZone, onUpdateZone,
  setEditConfig
}) => {
  return (
    <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
          <Settings2 className="w-4 h-4" /> Cấu hình Kho
        </h3>
        <div className="flex gap-2">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Chỉnh sửa
            </button>
          ) : (
            <>
              <button onClick={onSave} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1">
                <Save className="w-3 h-3" /> Lưu
              </button>
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1">
                <X className="w-3 h-3" /> Hủy
              </button>
            </>
          )}
          <button onClick={onReset} className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Mặc định
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Warehouse Dimensions */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Kích thước kho</h4>
          <div className="grid grid-cols-4 gap-3">
            <SettingsField label="Chiều rộng (m)" value={isEditing ? editConfig.width : config.width} disabled={!isEditing}
              onChange={v => setEditConfig(prev => ({ ...prev, width: Number(v), area: Number(v) * prev.length }))} />
            <SettingsField label="Chiều dài (m)" value={isEditing ? editConfig.length : config.length} disabled={!isEditing}
              onChange={v => setEditConfig(prev => ({ ...prev, length: Number(v), area: prev.width * Number(v) }))} />
            <SettingsField label="Diện tích (m²)" value={isEditing ? editConfig.area : config.area} disabled={true} />
            <SettingsField label="Kích thước slot (m²)" value={isEditing ? editConfig.slotSize : config.slotSize} disabled={!isEditing}
              onChange={v => setEditConfig(prev => ({ ...prev, slotSize: Number(v) }))} />
          </div>
        </div>

        {/* Alert Thresholds */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ngưỡng cảnh báo (%)</h4>
          <div className="grid grid-cols-3 gap-3">
            <SettingsField label="⚠️ Cảnh báo" value={isEditing ? editConfig.thresholds.warning : config.thresholds.warning} disabled={!isEditing}
              onChange={v => setEditConfig(prev => ({ ...prev, thresholds: { ...prev.thresholds, warning: Number(v) } }))} />
            <SettingsField label="🔶 Nguy hiểm" value={isEditing ? editConfig.thresholds.danger : config.thresholds.danger} disabled={!isEditing}
              onChange={v => setEditConfig(prev => ({ ...prev, thresholds: { ...prev.thresholds, danger: Number(v) } }))} />
            <SettingsField label="🔴 Khẩn cấp" value={isEditing ? editConfig.thresholds.critical : config.thresholds.critical} disabled={!isEditing}
              onChange={v => setEditConfig(prev => ({ ...prev, thresholds: { ...prev.thresholds, critical: Number(v) } }))} />
          </div>
        </div>

        {/* Zone Editor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khu vực ({(isEditing ? editConfig : config).zones.length})</h4>
            {isEditing && (
              <button onClick={onAddZone} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm khu vực
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(isEditing ? editConfig : config).zones.map((zone) => (
              <div key={zone.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color }} />
                {isEditing ? (
                  <>
                    <input value={zone.name} onChange={e => onUpdateZone(zone.id, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded bg-white" />
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>W:</span>
                      <input type="number" value={zone.w} onChange={e => onUpdateZone(zone.id, 'w', Number(e.target.value))}
                        className="w-12 px-1 py-1 border border-slate-200 rounded text-center bg-white text-xs" />
                      <span>H:</span>
                      <input type="number" value={zone.h} onChange={e => onUpdateZone(zone.id, 'h', Number(e.target.value))}
                        className="w-12 px-1 py-1 border border-slate-200 rounded text-center bg-white text-xs" />
                      <span>Kệ:</span>
                      <input type="number" value={zone.shelves} onChange={e => onUpdateZone(zone.id, 'shelves', Number(e.target.value))}
                        className="w-12 px-1 py-1 border border-slate-200 rounded text-center bg-white text-xs" />
                    </div>
                    <input type="color" value={zone.color} onChange={e => onUpdateZone(zone.id, 'color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0" />
                    <button onClick={() => onRemoveZone(zone.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-slate-700">{zone.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{zone.w}×{zone.h}m = {zone.w * zone.h} m²</span>
                    <span className="text-xs text-slate-400">{zone.shelves} kệ</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-green-50 border-green-200',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.slate}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-800">{value}</p>
    </div>
  );
};

const SettingsField: React.FC<{ label: string; value: number; disabled: boolean; onChange?: (v: string) => void }> = ({ label, value, disabled, onChange }) => (
  <div>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
    <input
      type="number" value={value} disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      className={`w-full px-3 py-2 rounded-lg border text-sm font-bold ${disabled ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-white text-slate-800 border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100'}`}
    />
  </div>
);

export default StorageSettingsPanel;
