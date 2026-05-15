import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { ShippingOrder } from '../types';
import { useSocket } from '../../../hooks/useSocket';

export const useShipping = (statusFilter?: string) => {
  const [shippingOrders, setShippingOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let qs = '';
      if (statusFilter && statusFilter !== 'All') qs = `?status=${encodeURIComponent(statusFilter)}`;
      const data = await api.get<ShippingOrder[]>(`/shipping${qs}`);
      setShippingOrders(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time sync: refetch when shipping or orders change
  useSocket({
    onShippingUpdate: () => fetch(),
    onOrderUpdate: () => fetch(),
  });

  return { shippingOrders, loading, error, refetch: fetch };
};

export const useShippingItems = (shippingId?: string) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!shippingId) return;
    setLoading(true);
    try {
      const order = await api.get<any>(`/shipping/${shippingId}`);
      setItems(order?.items || []);
    } catch (e) {
      console.error('Error fetching shipping items:', e);
    } finally {
      setLoading(false);
    }
  }, [shippingId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refetch: fetch };
};
