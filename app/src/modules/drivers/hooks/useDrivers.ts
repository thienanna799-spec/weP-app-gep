import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import { Driver } from '../types';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetch = useCallback(async () => {
    // Only show full-page spinner on first load, not on background refetches
    if (!hasFetched.current) setLoading(true);
    try {
      const data = await api.get<Driver[]>('/drivers');
      setDrivers(data);
      hasFetched.current = true;
    } catch (e) {
      console.error('Error fetching drivers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { drivers, loading, refetch: fetch };
};
