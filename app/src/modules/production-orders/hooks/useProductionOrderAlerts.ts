import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';

export function useProductionOrderAlerts() {
  const [activeCount, setActiveCount] = useState(0);

  const fetch = useCallback(async () => {
    try {
      // Fetch both pending orders (da_duyet) and active production orders
      const [ordersRes, poRes] = await Promise.all([
        api.get('/orders'),
        api.get('/production-orders')
      ]);

      const pendingOrders = (ordersRes as any[]).filter(o => o.status === 'da_duyet');
      const activePOs = (poRes as any[]).filter(po => po.status !== 'completed' && po.status !== 'cancelled');

      setActiveCount(pendingOrders.length + activePOs.length);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useSocket({ 
    onOrderUpdate: () => fetch(),
    // @ts-ignore
    onProductionOrderUpdate: () => fetch()
  });

  return { activeCount };
}
