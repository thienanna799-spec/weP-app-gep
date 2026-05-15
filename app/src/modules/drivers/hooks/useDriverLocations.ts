import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { GpsLog } from '../types';

export const useDriverLocations = (driverId?: string) => {
  const [locations, setLocations] = useState<GpsLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = driverId ? `/drivers/${driverId}/locations` : '/drivers/locations';
      const data = await api.get<GpsLog[]>(endpoint);
      setLocations(data);
    } catch (e) {
      console.error('Error fetching driver locations:', e);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { locations, loading, refetch: fetch };
};
