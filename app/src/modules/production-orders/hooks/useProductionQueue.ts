/**
 * useProductionQueue — Queue priority management hook
 * ───────────────────────────────────────────────────
 * Manages the queue ordering of approved orders waiting for production.
 * Persists positions to localStorage.
 */

import React, { useState, useMemo, useCallback } from 'react';

interface UseProductionQueueProps {
  approvedOrders: any[];
}

export function useProductionQueue({ approvedOrders }: UseProductionQueueProps) {
  const [queueOrder, setQueueOrder] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('lsx_queue_order');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const saveQueueOrder = useCallback((newQueue: Record<string, number>) => {
    setQueueOrder(newQueue);
    localStorage.setItem('lsx_queue_order', JSON.stringify(newQueue));
  }, []);

  // Sort approved orders by assigned queue number, unassigned go to end
  const sortedApprovedOrders = useMemo(() => {
    return [...approvedOrders].sort((a, b) => {
      const posA = queueOrder[a.id] ?? 999;
      const posB = queueOrder[b.id] ?? 999;
      if (posA !== posB) return posA - posB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [approvedOrders, queueOrder]);

  const handleSetQueuePosition = useCallback((orderId: string, position: number) => {
    const newQueue = { ...queueOrder };
    if (position <= 0) {
      delete newQueue[orderId];
    } else {
      newQueue[orderId] = position;
    }
    saveQueueOrder(newQueue);
  }, [queueOrder, saveQueueOrder]);

  const handleMoveUp = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = sortedApprovedOrders.findIndex(o => o.id === orderId);
    if (currentIndex <= 0) return;

    const newQueue = { ...queueOrder };
    const prevOrder = sortedApprovedOrders[currentIndex - 1];
    const prevPos = newQueue[prevOrder.id] ?? currentIndex;
    const curPos = newQueue[orderId] ?? currentIndex + 1;

    newQueue[orderId] = prevPos;
    newQueue[prevOrder.id] = curPos;
    saveQueueOrder(newQueue);
  }, [sortedApprovedOrders, queueOrder, saveQueueOrder]);

  const handleMoveDown = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = sortedApprovedOrders.findIndex(o => o.id === orderId);
    if (currentIndex >= sortedApprovedOrders.length - 1) return;

    const newQueue = { ...queueOrder };
    const nextOrder = sortedApprovedOrders[currentIndex + 1];
    const nextPos = newQueue[nextOrder.id] ?? currentIndex + 2;
    const curPos = newQueue[orderId] ?? currentIndex + 1;

    newQueue[orderId] = nextPos;
    newQueue[nextOrder.id] = curPos;
    saveQueueOrder(newQueue);
  }, [sortedApprovedOrders, queueOrder, saveQueueOrder]);

  return {
    queueOrder,
    sortedApprovedOrders,
    handleSetQueuePosition,
    handleMoveUp,
    handleMoveDown,
  };
}
