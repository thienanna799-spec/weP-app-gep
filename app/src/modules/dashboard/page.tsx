import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Package, QrCode, Truck, TrendingUp, Clock, Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Order } from '../../types/order.types';
import { ProductRoll } from '../inventory/types';
import { Material } from '../materials/types';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import DashboardCharts from './components/DashboardCharts';
import ActivityFeed from './components/ActivityFeed';

const COLOR_MAPS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-500',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-500',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-500',
  amber: 'bg-amber-50 text-amber-600 border-amber-500',
  rose: 'bg-rose-50 text-rose-600 border-rose-500',
};

const DashboardPage: React.FC = () => {
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
        const [ordersData, rollsData, materialsData, ocrData] = await Promise.all([
          api.get<Order[]>('/orders'), 
          api.get<ProductRoll[]>('/rolls'), 
          api.get<Material[]>('/materials'),
          api.get<{ pending: number; highRisk: number }>('/ocr-audit/stats').catch(() => ({ pending: 0, highRisk: 0 }))
        ]);
        setOrders(ordersData); setRolls(rollsData); setMaterials(materialsData); setOcrStats(ocrData as any);
        try {
          const actLogs = await api.get<any[]>('/admin/activity-logs');
          const iconMap: Record<string, any> = { 'Đơn hàng': ShoppingCart, 'Sản xuất': QrCode, 'Xuất kho': Truck, 'Tồn kho': Package };
          const mapped = actLogs.slice(0, 6).map((log: any) => ({ id: log.id, user: log.email?.split('@')[0] || 'System', action: log.action, target: log.description || '', time: log.createdAt, icon: iconMap[log.module] || Activity, type: log.action?.includes('Xóa') || log.action?.includes('Hủy') ? 'warning' : 'success' }));
          if (mapped.length > 0) setActivities(mapped);
        } catch {}
        try { const sd = await api.get<any[]>('/shipping'); const dd = await api.get<any[]>('/drivers'); setShippingCount(sd.filter((s: any) => s.status === 'dang_giao').length); setDriverCount(dd.filter((d: any) => d.status === 'active' || d.status === 'delivering').length); } catch {}
      } catch (err) { console.error('Dashboard fetch error:', err); }
      finally { setLoading(false); }
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
    const calcChange = (c: number, p: number) => { if (p === 0) return c > 0 ? '+100%' : '0%'; const pct = Math.round(((c - p) / p) * 100); return pct >= 0 ? `+${pct}%` : `${pct}%`; };
    return {
      ordersToday: ordersToday.length, orderChange: calcChange(ordersToday.length, ordersYesterday.length),
      productionToday: productionToday.length, productionChange: calcChange(productionToday.length, productionYesterday.length),
      totalStock: rolls.filter(r => r.status === 'trong_kho').length, shippedToday: rolls.filter(r => r.status === 'da_xuat_kho').length,
      stockValue: rolls.reduce((acc, r) => acc + (r.weight * 25000), 0),
      lowMaterials: materials.filter(m => m.currentStock <= m.minStock).length,
      pendingOrders: orders.filter(o => o.status === 'cho_duyet').length,
      nearDeadline: orders.filter(o => o.deliveryDeadline && new Date(o.deliveryDeadline) <= tomorrow && o.status !== 'hoan_thanh').length,
      activeDrivers: driverCount, activeShipping: shippingCount,
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
      return { day: t(`dashboard.${dayKeys[d.getDay()]}`), amount: rolls.filter(r => { const rd = new Date(r.productionDate); return rd >= d && rd < nextD; }).length };
    });
  }, [rolls, t]);

  if (loading) return <LoadingSpinner />;
  if (profile && profile.status !== 'active') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6"><Clock className="w-10 h-10 text-amber-500 animate-pulse" /></div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t('auth.account_pending')}</h2>
        <p className="text-slate-500 max-w-md">{t('auth.account_pending_desc', { name: profile.name })}</p>
        <div className="mt-8 pt-8 border-t border-slate-50 w-full max-w-sm flex flex-col gap-3">
          <Badge variant="blue" className="w-fit mx-auto">{t('common.status')}: {profile.status}</Badge>
          <p className="text-[10px] text-slate-400 font-mono">UID: {profile.uid}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">{t('dashboard.title')}</h2>
          <p className="text-slate-500 text-sm font-medium">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" className="px-3 py-1 animate-pulse flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />{t('dashboard.live_update')}</Badge>
          <div className="text-xs text-slate-400 font-mono">{formatDateTime(new Date())}</div>
        </div>
      </div>

      {/* Task Center Widget: OCR Alerts */}
      {ocrStats.pending > 0 && (
        <Card className="bg-rose-50 border-rose-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900">Task Center: Bằng chứng gian lận chờ duyệt</h3>
                <p className="text-sm text-rose-700">
                  Hệ thống OCR phát hiện <b>{ocrStats.pending}</b> hóa đơn có dấu hiệu bất thường (trong đó có {ocrStats.highRisk} rủi ro cao).
                </p>
              </div>
            </div>
            <Link to="/ocr-audit">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-lg shadow-rose-200">
                Xử lý ngay <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: t('dashboard.orders_today'), value: kpis.ordersToday, icon: ShoppingCart, color: 'blue', change: kpis.orderChange },
          { label: t('dashboard.production_today'), value: kpis.productionToday, icon: QrCode, color: 'indigo', change: kpis.productionChange },
          { label: t('dashboard.current_stock'), value: kpis.totalStock, icon: Package, color: 'emerald', change: `${rolls.length} ${t('dashboard.total_suffix')}` },
          { label: t('dashboard.shipped_today'), value: kpis.shippedToday, icon: Truck, color: 'amber', change: `${kpis.activeShipping} ${t('dashboard.delivering')}` },
          { label: t('dashboard.stock_value'), value: formatCurrency(kpis.stockValue).split(' ')[0] + 'k', icon: TrendingUp, color: 'rose', change: `${kpis.activeDrivers} ${t('dashboard.drivers_suffix')}` },
        ].map((kpi, idx) => (
          <Card key={idx} className="p-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-none shadow-sm bg-white">
            <div className="flex justify-between items-start mb-2">
              <div className={`p-2 rounded-lg ${COLOR_MAPS[kpi.color].split(' ').slice(0, 2).join(' ')} group-hover:scale-110 transition-transform`}><kpi.icon className="w-5 h-5" /></div>
              <span className={`text-[10px] font-bold ${kpi.change.toString().startsWith('+') ? 'text-green-500' : 'text-rose-500'} bg-slate-50 px-1.5 py-0.5 rounded-full`}>{kpi.change}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mb-0.5">{kpi.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            <div className={`absolute bottom-0 left-0 h-1 ${COLOR_MAPS[kpi.color].split(' ').pop()} w-full opacity-20`} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <DashboardCharts productionHistory={productionHistory} orderStatusSummary={orderStatusSummary} kpis={kpis} />
        <ActivityFeed activities={activities} recentExports={rolls.filter(r => r.status === 'da_xuat_kho').slice(0, 3)} />
      </div>
    </div>
  );
};

export default DashboardPage;
