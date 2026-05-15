import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { FuelLog } from '../types/driver.types';

export const useFuelLogs = () => {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<FuelLog[]>('/fuel-logs');
      setFuelLogs(data);
    } catch (e) {
      console.error('Error fetching fuel logs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { fuelLogs, loading, refetch: fetch };
};
