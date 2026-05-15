import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { DriverSession } from '../types/driver.types';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<DriverSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DriverSession[]>('/drivers');
      setDrivers(data);
    } catch (e) {
      console.error('Error fetching drivers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { drivers, loading, refetch: fetch };
};
