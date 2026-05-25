/**
 * useShippingAlerts — Counts shipping tasks that need processing:
 *  - status in ['da_duyet', 'dang_chuan_bi', 'cho_xuat_kho', 'dang_giao']
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { Order } from '../../../types/order.types';
import { useSocket } from '../../../hooks/useSocket';

const ACTIVE_SHIPPING_STATUSES = ['da_duyet', 'dang_chuan_bi', 'cho_xuat_kho', 'dang_giao'];

export function useShippingAlerts() {
  const [activeCount, setActiveCount] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const orders = await api.get<Order[]>('/orders');
      
      const active = orders.filter(o => ACTIVE_SHIPPING_STATUSES.includes(o.status)).length;
      setActiveCount(active);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useSocket({ 
    onOrderUpdate: () => fetch(),
    onShippingUpdate: () => fetch()
  });

  return { activeCount };
}
