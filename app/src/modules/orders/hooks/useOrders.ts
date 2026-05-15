import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { Order } from '../../../types/order.types';
import { useSocket } from '../../../hooks/useSocket';

export const useOrders = (statusFilter?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let qs = '';
      if (statusFilter && statusFilter !== 'All') {
        qs = `?status=${encodeURIComponent(statusFilter)}`;
      }
      const data = await api.get<Order[]>(`/orders${qs}`);
      setOrders(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time sync: refetch when any order changes anywhere in the system
  useSocket({
    onOrderUpdate: () => fetch(),
  });

  return { orders, loading, error, refetch: fetch };
};
