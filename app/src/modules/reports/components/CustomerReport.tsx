import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Users, RefreshCw } from 'lucide-react';
import ChartZoom from '../../../components/ui/ChartZoom';

interface Props { data: any; loading: boolean }

const CustomerReport: React.FC<Props> = ({ data, loading }) => {
  if (loading || !data) return <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}</div>;

  const { topCustomers, totalCustomers, repeatCustomers, repeatRate, monthlyTrend, totalOrders } = data;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng đơn hàng</p>
          <span className="text-2xl font-black text-slate-900 block mt-1 leading-none">{totalOrders}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Số khách hàng</p>
          <span className="text-2xl font-black text-blue-600 block mt-1 leading-none">{totalCustomers}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Khách quay lại</p>
          <span className="text-2xl font-black text-emerald-600 block mt-1 leading-none">{repeatCustomers}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tỷ lệ quay lại</p>
          <span className={`text-2xl font-black block mt-1 leading-none ${repeatRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>{repeatRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <h4 className="text-sm font-bold text-slate-800 mb-2">🏆 Top khách hàng</h4>
          <ChartZoom title="Top khách hàng" height="200px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers?.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="orderCount" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Số đơn" />
              </BarChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <h4 className="text-sm font-bold text-slate-800 mb-2">📈 Đơn hàng theo tháng</h4>
          <ChartZoom title="Đơn hàng theo tháng" height="200px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} name="Số đơn" />
              </LineChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;
