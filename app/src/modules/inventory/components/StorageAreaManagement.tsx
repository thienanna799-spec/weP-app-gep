import React, { useState, useEffect } from 'react';
import { WarehouseConfig, WarehouseZone } from './warehouseConfig';
import DEFAULT_CONFIG from './warehouseConfig';
import StorageSettingsPanel from './StorageSettingsPanel';
import { StorageCapacityTab } from './StorageCapacityTab';

const StorageAreaManagement: React.FC = () => {
  const [config, setConfig] = useState<WarehouseConfig>(DEFAULT_CONFIG);
  const [editConfig, setEditConfig] = useState<WarehouseConfig>(DEFAULT_CONFIG);
  const [isEditing, setIsEditing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gep_warehouse_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        setEditConfig(parsed);
      } catch (e) {
        console.error('Failed to parse warehouse config', e);
      }
    }
  }, []);

  const handleSave = () => {
    setConfig(editConfig);
    localStorage.setItem('gep_warehouse_config', JSON.stringify(editConfig));
    setIsEditing(false);
    window.dispatchEvent(new Event('warehouse_config_updated'));
  };

  const handleReset = () => {
    if (confirm('Bạn có chắc muốn khôi phục cấu hình mặc định?')) {
      setConfig(DEFAULT_CONFIG);
      setEditConfig(DEFAULT_CONFIG);
      localStorage.setItem('gep_warehouse_config', JSON.stringify(DEFAULT_CONFIG));
      setIsEditing(false);
      window.dispatchEvent(new Event('warehouse_config_updated'));
    }
  };

  const handleAddZone = () => {
    setEditConfig(prev => ({
      ...prev,
      zones: [
        ...prev.zones,
        {
          id: `zone_${Date.now()}`,
          name: 'Khu vực mới',
          x: 0,
          y: 0,
          w: 2,
          h: 2,
          color: '#3B82F6',
          shelves: 1
        }
      ]
    }));
  };

  const handleRemoveZone = (zoneId: string) => {
    setEditConfig(prev => ({
      ...prev,
      zones: prev.zones.filter(z => z.id !== zoneId)
    }));
  };

  const handleUpdateZone = (zoneId: string, field: keyof WarehouseZone, value: any) => {
    setEditConfig(prev => ({
      ...prev,
      zones: prev.zones.map(z => z.id === zoneId ? { ...z, [field]: value } : z)
    }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <StorageCapacityTab config={config} />
      </div>
      <div className="xl:col-span-1">
        <StorageSettingsPanel
          config={config}
          editConfig={editConfig}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onSave={handleSave}
          onReset={handleReset}
          onAddZone={handleAddZone}
          onRemoveZone={handleRemoveZone}
          onUpdateZone={handleUpdateZone}
          setEditConfig={setEditConfig}
        />
      </div>
    </div>
  );
};

export default StorageAreaManagement;
