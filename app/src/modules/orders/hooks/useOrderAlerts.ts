/**
 * useOrderAlerts — Counts orders that need attention:
 *  - chờ duyệt (status = 'cho_duyet')
 *  - chưa thanh toán (paymentStatus = 'chua_thanh_toan' or missing)
 *    AND order is active
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { Order } from '../../../types/order.types';
import { useSocket } from '../../../hooks/useSocket';

const EXCLUDED_STATUSES = ['huy', 'tu_choi'];

export function useOrderAlerts() {
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const orders = await api.get<Order[]>('/orders');
      const pending = orders.filter(o => o.status === 'cho_duyet').length;
      const unpaid = orders.filter(o =>
        !EXCLUDED_STATUSES.includes(o.status) &&
        (!o.paymentStatus || o.paymentStatus === 'chua_thanh_toan' || o.paymentStatus === 'unpaid')
      ).length;
      setPendingApprovalCount(pending);
      setUnpaidCount(unpaid);
    } catch {
      // silently fail — sidebar badge is non-critical
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useSocket({ onOrderUpdate: () => fetch() });

  const totalAlerts = pendingApprovalCount + unpaidCount;

  return { pendingApprovalCount, unpaidCount, totalAlerts };
}
