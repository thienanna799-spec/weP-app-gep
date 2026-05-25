import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DEFAULT_CONFIG from '../modules/inventory/components/warehouseConfig';

export interface ZoneUsage {
  id: string;
  name: string;
  area: number;
  used_area: number;
  roll_count: number;
  usage_percent: number;
}

export interface StorageCapacityData {
  total_area: number;
  used_area: number;
  available_area: number;
  total_slots: number;
  used_slots: number;
  usage_percent: number;
  zones: ZoneUsage[];
}

import { useSocket } from './useSocket';

export const useStorageCapacity = (zones: ZoneUsage[] | any[]) => {
  const [capacity, setCapacity] = useState<StorageCapacityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get<StorageCapacityData>(
        '/inventory/storage-capacity?zones=' + encodeURIComponent(JSON.stringify(zones || []))
      );
      setCapacity(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi tính toán diện tích');
    } finally {
      setLoading(false);
    }
  }, [zones]);

  useEffect(() => {
    fetchCapacity();
  }, [fetchCapacity]);

  // Real-time synchronization
  useSocket({ onInventoryUpdate: fetchCapacity });

  return { capacity, loading, error, refetch: fetchCapacity };
};