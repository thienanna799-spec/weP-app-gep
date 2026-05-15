import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip, PieChart, Pie, Cell } from 'recharts';
import { ShoppingCart, Package, Clock, Users, AlertCircle, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ChartZoom from '../../../components/ui/ChartZoom';

interface DashboardChartsProps {
  productionHistory: { day: string; amount: number }[];
  orderStatusSummary: { name: string; value: number; color: string }[];
  kpis: {
    lowMaterials: number;
    nearDeadline: number;
    pendingOrders: number;
    activeDrivers: number;
    activeShipping: number;
  };
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ productionHistory, orderStatusSummary, kpis }) => {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-8 space-y-6">
      {/* Production Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-slate-900 tracking-tight">{t('dashboard.production_performance')}</h3>
            <p className="text-xs text-slate-500">{t('dashboard.production_weekly_desc')}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="blue" className="cursor-pointer">{t('dashboard.this_week')}</Badge>
            <Badge variant="gray" className="cursor-pointer">{t('dashboard.last_week')}</Badge>
          </div>
        </div>
        <ChartZoom title={t('dashboard.production_performance')} height="300px">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={productionHistory}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <ReTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartZoom>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown (Pie) */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 mb-6">{t('dashboard.order_status')}</h3>
          <ChartZoom title={t('dashboard.order_status')} height="240px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusSummary} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {orderStatusSummary.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartZoom>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {orderStatusSummary.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600">{item.name}</span>
                <span className="text-xs text-slate-400 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Critical Warnings */}
        <Card className="p-6 border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Bell className="w-24 h-24 rotate-12" /></div>
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-rose-500" />{t('dashboard.operational_warnings')}</h3>
          <div className="space-y-3">
            {kpis.lowMaterials > 0 && (
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Package className="w-5 h-5 text-rose-600" />
                <div><p className="text-xs font-bold text-rose-900">{t('dashboard.low_materials')}</p><p className="text-[10px] text-rose-600">{t('dashboard.low_materials_desc', { count: kpis.lowMaterials })}</p></div>
              </div>
            )}
            {kpis.nearDeadline > 0 && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <Clock className="w-5 h-5 text-amber-600" />
                <div><p className="text-xs font-bold text-amber-900">{t('dashboard.near_deadline')}</p><p className="text-[10px] text-amber-600">{t('dashboard.near_deadline_desc', { count: kpis.nearDeadline })}</p></div>
              </div>
            )}
            {kpis.pendingOrders > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <div><p className="text-xs font-bold text-blue-900">{t('dashboard.orders_pending')}</p><p className="text-[10px] text-blue-600">{t('dashboard.orders_pending_desc', { count: kpis.pendingOrders })}</p></div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Users className="w-5 h-5 text-slate-400" />
              <div><p className="text-xs font-bold text-slate-900">{t('dashboard.drivers_shipping')}</p><p className="text-[10px] text-slate-500">{t('dashboard.drivers_shipping_desc', { drivers: kpis.activeDrivers, shipping: kpis.activeShipping })}</p></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
