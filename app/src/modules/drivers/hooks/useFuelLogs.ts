import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { FuelLog } from '../types';

export const useFuelLogs = (driverId?: string) => {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const qs = driverId ? `?driverId=${driverId}` : '';
      const data = await api.get<FuelLog[]>(`/fuel-logs${qs}`);
      setFuelLogs(data);
    } catch (e) {
      console.error('Error fetching fuel logs:', e);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { fuelLogs, loading, refetch: fetch };
};
