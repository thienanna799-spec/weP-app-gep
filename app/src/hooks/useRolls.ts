import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Roll } from '../types/roll.types';
import { useSocket } from './useSocket';

export const useRolls = (orderId?: string) => {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const qs = orderId ? `?orderId=${orderId}` : '';
      const data = await api.get<Roll[]>(`/rolls${qs}`);
      setRolls(data);
    } catch (e) {
      console.error('Error fetching rolls:', e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time sync: refetch when inventory or orders change
  useSocket({
    onInventoryUpdate: () => fetch(),
    onOrderUpdate: () => fetch(),
  });

  return { rolls, loading, refetch: fetch };
};
