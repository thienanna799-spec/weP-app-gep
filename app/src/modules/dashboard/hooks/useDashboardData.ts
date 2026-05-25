import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Package, QrCode, Truck, Activity } from 'lucide-react';
import api from '../../../services/api';
import { Order } from '../../../types/order.types';
import { ProductRoll } from '../../inventory/types';
import { Material } from '../../materials/types';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';

export const useDashboardData = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [rolls, setRolls] = useState<ProductRoll[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingCount, setShippingCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [ocrStats, setOcrStats] = useState({ pending: 0, highRisk: 0 });

  useEffect(() => {
    if (!profile || profile.status !== 'active') { setLoading(false); return; }
    
    const fetchData = async () => {
      try {
        const [ordersData, rollsData, materialsData, ocrData, actLogs, sd, dd] = await Promise.all([
          api.get<Order[]>('/orders').catch(() => []), 
          api.get<ProductRoll[]>('/rolls').catch(() => []), 
          api.get<Material[]>('/materials').catch(() => []),
          api.get<{ pending: number; highRisk: number }>('/ocr-audit/stats').catch(() => ({ pending: 0, highRisk: 0 })),
          api.get<any[]>('/admin/activity-logs').catch(() => []),
          api.get<any[]>('/shipping').catch(() => []),
          api.get<any[]>('/drivers').catch(() => [])
        ]);

        setOrders(Array.isArray(ordersData) ? ordersData : []); 
        setRolls(Array.isArray(rollsData) ? rollsData : []); 
        setMaterials(Array.isArray(materialsData) ? materialsData : []); 
        setOcrStats(ocrData as any);

        const iconMap: Record<string, any> = { 'Đơn hàng': ShoppingCart, 'Sản xuất': QrCode, 'Xuất kho': Truck, 'Tồn kho': Package };
        const mapped = Array.isArray(actLogs) ? actLogs.slice(0, 6).map((log: any) => ({ 
          id: log.id, 
          user: log.email?.split('@')[0] || 'System', 
          action: log.action, 
          target: log.description || '', 
          time: log.createdAt, 
          icon: iconMap[log.module] || Activity, 
          type: log.action?.includes('Xóa') || log.action?.includes('Hủy') ? 'warning' : 'success' 
        })) : [];
        if (mapped.length > 0) setActivities(mapped);

        setShippingCount(Array.isArray(sd) ? sd.filter((s: any) => s.status === 'dang_giao').length : 0); 
        setDriverCount(Array.isArray(dd) ? dd.filter((d: any) => d.status === 'active' || d.status === 'delivering').length : 0);
      } catch (err) { 
        console.error('Dashboard fetch error:', err); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [profile?.uid, profile?.status]);

  // Real-time sync: refresh dashboard when data changes anywhere
  useSocket({
    onOrderUpdate: () => {
      api.get<Order[]>('/orders').then(setOrders).catch(() => {});
    },
    onInventoryUpdate: () => {
      api.get<ProductRoll[]>('/rolls').then(setRolls).catch(() => {});
    },
    onShippingUpdate: () => {
      api.get<any[]>('/shipping').then(sd => setShippingCount(sd.filter((s: any) => s.status === 'dang_giao').length)).catch(() => {});
    },
  });

  const kpis = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const ordersToday = orders.filter(o => new Date(o.createdAt as string) >= today);
    const ordersYesterday = orders.filter(o => { const d = new Date(o.createdAt as string); return d >= yesterday && d < today; });
    const productionToday = rolls.filter(r => new Date(r.productionDate) >= today);
    const productionYesterday = rolls.filter(r => { const d = new Date(r.productionDate); return d >= yesterday && d < today; });
    
    const calcChange = (c: number, p: number) => { 
      if (p === 0) return c > 0 ? '+100%' : '0%'; 
      const pct = Math.round(((c - p) / p) * 100); 
      return pct >= 0 ? `+${pct}%` : `${pct}%`; 
    };

    return {
      ordersToday: ordersToday.length, 
      orderChange: calcChange(ordersToday.length, ordersYesterday.length),
      productionToday: productionToday.length, 
      productionChange: calcChange(productionToday.length, productionYesterday.length),
      totalStock: rolls.filter(r => r.status === 'trong_kho').length, 
      shippedToday: rolls.filter(r => r.status === 'da_xuat_kho').length,
      stockValue: rolls.reduce((acc, r) => acc + (r.weight * 25000), 0),
      lowMaterials: materials.filter(m => m.currentStock <= m.minStock).length,
      pendingOrders: orders.filter(o => o.status === 'cho_duyet').length,
      nearDeadline: orders.filter(o => o.deliveryDeadline && new Date(o.deliveryDeadline) <= tomorrow && o.status !== 'hoan_thanh').length,
      activeDrivers: driverCount, 
      activeShipping: shippingCount,
    };
  }, [orders, rolls, materials, driverCount, shippingCount]);

  const orderStatusSummary = useMemo(() => [
    { name: t('dashboard.pending_approval'), value: orders.filter(o => o.status === 'cho_duyet').length, color: '#f59e0b' },
    { name: t('dashboard.approved'), value: orders.filter(o => o.status === 'da_duyet').length, color: '#6366f1' },
    { name: t('dashboard.preparing'), value: orders.filter(o => o.status === 'dang_chuan_bi').length, color: '#3b82f6' },
    { name: t('dashboard.ready_to_ship'), value: orders.filter(o => o.status === 'cho_xuat_kho').length, color: '#8b5cf6' },
    { name: t('dashboard.in_delivery'), value: orders.filter(o => o.status === 'dang_giao').length, color: '#f97316' },
    { name: t('dashboard.completed'), value: orders.filter(o => o.status === 'hoan_thanh').length, color: '#10b981' },
  ], [orders, t]);

  const productionHistory = useMemo(() => {
    const dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
      const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1);
      return { 
        day: t(`dashboard.${dayKeys[d.getDay()]}`), 
        amount: rolls.filter(r => { const rd = new Date(r.productionDate); return rd >= d && rd < nextD; }).length 
      };
    });
  }, [rolls, t]);

  return {
    profile,
    loading,
    activities,
    ocrStats,
    kpis,
    orderStatusSummary,
    productionHistory,
    rolls,
  };
};
