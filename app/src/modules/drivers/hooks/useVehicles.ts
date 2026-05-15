import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import { Vehicle } from '../types';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasFetched.current) setLoading(true);
    try {
      const data = await api.get<Vehicle[]>('/vehicles');
      setVehicles(data);
      hasFetched.current = true;
    } catch (e) {
      console.error('Error fetching vehicles:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { vehicles, loading, refetch: fetch };
};
