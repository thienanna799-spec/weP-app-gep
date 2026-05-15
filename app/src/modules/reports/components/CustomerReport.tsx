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
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Tổng đơn hàng</p>
          <span className="text-3xl font-black text-slate-900">{totalOrders}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Số khách hàng</p>
          <span className="text-3xl font-black text-blue-600">{totalCustomers}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Khách quay lại</p>
          <span className="text-3xl font-black text-emerald-600">{repeatCustomers}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Tỷ lệ quay lại</p>
          <span className={`text-3xl font-black ${repeatRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>{repeatRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4">🏆 Top khách hàng</h4>
          <ChartZoom title="Top khách hàng" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers?.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="orderCount" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Số đơn" />
              </BarChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4">📈 Đơn hàng theo tháng</h4>
          <ChartZoom title="Đơn hàng theo tháng" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="Số đơn" />
              </LineChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;
