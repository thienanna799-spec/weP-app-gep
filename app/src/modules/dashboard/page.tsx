import React from 'react';
import { ShoppingCart, Package, QrCode, Truck, TrendingUp, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/format';
import DashboardCharts from './components/DashboardCharts';
import ActivityFeed from './components/ActivityFeed';
import { useDashboardData } from './hooks/useDashboardData';

const COLOR_MAPS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-500',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-500',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-500',
  amber: 'bg-amber-50 text-amber-600 border-amber-500',
  rose: 'bg-rose-50 text-rose-600 border-rose-500',
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  
  const {
    profile,
    loading,
    activities,
    ocrStats,
    kpis,
    orderStatusSummary,
    productionHistory,
    rolls,
  } = useDashboardData();

  if (loading) return <LoadingSpinner />;
  
  if (profile && profile.status !== 'active') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
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
    <div className="h-[calc(100vh-90px)] flex flex-col gap-4 overflow-hidden pb-2">

      {/* Task Center Widget: OCR Alerts */}
      {ocrStats.pending > 0 && (
        <Card className="bg-rose-50 border-rose-200 p-3 shadow-sm shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Task Center: Bằng chứng gian lận chờ duyệt</h3>
                <p className="text-xs text-rose-700">
                  Hệ thống OCR phát hiện <b>{ocrStats.pending}</b> hóa đơn có dấu hiệu bất thường (trong đó có {ocrStats.highRisk} rủi ro cao).
                </p>
              </div>
            </div>
            <Link to="/drivers">
              <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-lg shadow-rose-200 py-1.5 px-3 text-xs">
                Xử lý ngay <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        {[
          { label: t('dashboard.orders_today'), value: kpis.ordersToday, icon: ShoppingCart, color: 'blue', change: kpis.orderChange },
          { label: t('dashboard.production_today'), value: kpis.productionToday, icon: QrCode, color: 'indigo', change: kpis.productionChange },
          { label: t('dashboard.current_stock'), value: kpis.totalStock, icon: Package, color: 'emerald', change: `${rolls.length} ${t('dashboard.total_suffix')}` },
          { label: t('dashboard.shipped_today'), value: kpis.shippedToday, icon: Truck, color: 'amber', change: `${kpis.activeShipping} ${t('dashboard.delivering')}` },
          { label: t('dashboard.stock_value'), value: formatCurrency(kpis.stockValue).split(' ')[0] + 'k', icon: TrendingUp, color: 'rose', change: `${kpis.activeDrivers} ${t('dashboard.drivers_suffix')}` },
        ].map((kpi, idx) => (
          <Card key={idx} className="p-3 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-none shadow-sm bg-white">
            <div className="flex justify-between items-start mb-1">
              <div className={`p-1.5 rounded-lg ${COLOR_MAPS[kpi.color].split(' ').slice(0, 2).join(' ')} group-hover:scale-110 transition-transform`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold ${kpi.change.toString().startsWith('+') ? 'text-green-500' : 'text-rose-500'} bg-slate-50 px-1.5 py-0.5 rounded-full`}>
                {kpi.change}
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mb-0.5">{kpi.value}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            <div className={`absolute bottom-0 left-0 h-1 ${COLOR_MAPS[kpi.color].split(' ').pop()} w-full opacity-20`} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <DashboardCharts productionHistory={productionHistory} orderStatusSummary={orderStatusSummary} kpis={kpis} />
        <ActivityFeed activities={activities} recentExports={rolls.filter(r => r.status === 'da_xuat_kho').slice(0, 3)} />
      </div>
    </div>
  );
};

export default DashboardPage;
