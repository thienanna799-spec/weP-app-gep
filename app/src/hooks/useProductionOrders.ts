import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { ProductionOrder } from '../types/productionOrder.types';

const POLL_INTERVAL = 5000; // 5 seconds for real-time-like updates

export const useProductionOrders = () => {
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<ProductionOrder[]>('/production-orders');
      setProductionOrders(data);
    } catch (e) {
      console.error('Error fetching production orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch();

    // Poll every 5s for real-time roll count updates
    intervalRef.current = setInterval(fetch, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  return { productionOrders, loading, refetch: fetch };
};
