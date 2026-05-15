import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Order } from '../types/order.types';

export const useOrders = (statusFilter?: string | string[]) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let qs = '';
      if (statusFilter) {
        const status = Array.isArray(statusFilter) ? statusFilter.join(',') : statusFilter;
        if (status && status !== 'All') qs = `?status=${encodeURIComponent(status)}`;
      }
      const data = await api.get<Order[]>(`/orders${qs}`);
      setOrders(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(statusFilter)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { orders, loading, error, refetch: fetch };
};
