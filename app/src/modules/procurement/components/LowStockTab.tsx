import React, { useState, useEffect, useCallback } from 'react';
import { lowStockService } from '../services/procurement.service';
import type { LowStockMaterial } from '../services/procurement.service';
import LowStockAlert from '../components/LowStockAlert';

interface LowStockTabProps {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
  onCountUpdate?: (count: number) => void;
}

export default function LowStockTab({ toast, onCountUpdate }: LowStockTabProps) {
  const [lowStockItems, setLowStockItems] = useState<LowStockMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const data = await lowStockService.getAll();
      setLowStockItems(data);
      if (onCountUpdate) onCountUpdate(data.length);
    } catch { toast.error('Lỗi tải NVL sắp hết'); }
    setLoading(false);
  }, [toast, onCountUpdate]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const handleSuggestPo = async (materialId: string) => {
    try {
      await lowStockService.suggestPO(materialId);
      toast.success('Đã tạo PO gợi ý — Kiểm tra tab Đơn mua hàng');
    } catch (e: any) { toast.error(e?.message || 'Lỗi'); }
  };

  return (
    <LowStockAlert
      items={lowStockItems}
      loading={loading}
      onSuggestPO={handleSuggestPo}
      onRefresh={fetchLowStock}
    />
  );
}
