/**
 * FinanceCustomerTab — Customer analytics
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import Card from '../../../components/ui/Card';
import ChartZoom from '../../../components/ui/ChartZoom';
import { formatCurrency } from '../../../utils/format';

interface Props {
  orders: {
    id: string; customerName: string; customerId?: string;
    totalRevenue?: number; status: string; createdAt: string;
    paymentStatus?: string;
  }[];
  customers: { id: string; name: string; totalOrders: number; totalRevenue: number; createdAt: string }[];
}

const FinanceCustomerTab: React.FC<Props> = ({ orders, customers }) => {
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; orders: number; paid: number; unpaid: number }> = {};
    orders.filter(o => ['hoan_thanh', 'dang_giao'].includes(o.status) && (o.totalRevenue || 0) > 0).forEach(o => {
      const key = o.customerName;
      if (!map[key]) map[key] = { name: key, revenue: 0, orders: 0, paid: 0, unpaid: 0 };
      map[key].revenue += o.totalRevenue || 0;
      map[key].orders++;
      if (o.paymentStatus === 'da_thanh_toan') map[key].paid += o.totalRevenue || 0;
      else map[key].unpaid += o.totalRevenue || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [orders]);

  const chartData = topCustomers.slice(0, 8).map(c => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + '…' : c.name,
    revenue: c.revenue,
  }));

  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { const m = new Date(o.createdAt).toISOString().slice(0, 7); map[m] = (map[m] || 0) + 1; });
    return Object.entries(map).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }));
  }, [orders]);

  const newCount = customers.filter(c => { const d = new Date(c.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const totalCustomerCount = customers.length;
  const activeCustomerCount = new Set(orders.map(o => o.customerName)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng KH', value: totalCustomerCount, color: 'blue' },
          { label: 'KH hoạt động', value: activeCustomerCount, color: 'green' },
          { label: 'KH mới (tháng)', value: newCount, color: 'purple' },
          { label: 'Giá trị TB/KH', value: activeCustomerCount > 0 ? formatCurrency(topCustomers.reduce((s, c) => s + c.revenue, 0) / activeCustomerCount) : '0', color: 'amber' },
        ].map((k, i) => (
          <Card key={i} className={`p-4 text-center border-t-4 border-${k.color}-500`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{k.label}</p>
            <p className={`text-2xl font-black text-${k.color}-600`}>{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 Top khách hàng theo doanh thu</h3>
          {chartData.length === 0 ? <p className="text-center text-gray-400 italic py-8">Chưa có dữ liệu</p> : (
            <ChartZoom title="Top khách hàng doanh thu" height="300px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartZoom>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Xu hướng đơn hàng theo tháng</h3>
          {monthlyTrend.length === 0 ? <p className="text-center text-gray-400 italic py-8">Chưa có dữ liệu</p> : (
            <ChartZoom title="Xu hướng đơn hàng theo tháng" height="300px">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                  <Line type="monotone" dataKey="count" name="Đơn hàng" stroke="#22c55e" strokeWidth={3} dot={{ r: 5, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartZoom>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Chi tiết doanh thu theo khách hàng</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-indigo-50 text-indigo-800 font-bold text-xs uppercase">
              <tr><th className="p-3">#</th><th className="p-3">Khách hàng</th><th className="p-3 text-center">Đơn</th><th className="p-3 text-right">Doanh thu</th><th className="p-3 text-right">Đã TT</th><th className="p-3 text-right">Chưa TT</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topCustomers.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">Chưa có dữ liệu</td></tr> : topCustomers.map((c, i) => (
                <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-3 font-bold text-slate-400">{i + 1}</td>
                  <td className="p-3 font-bold">{c.name}</td>
                  <td className="p-3 text-center">{c.orders}</td>
                  <td className="p-3 text-right font-bold text-blue-600">{formatCurrency(c.revenue)}</td>
                  <td className="p-3 text-right font-bold text-green-600">{formatCurrency(c.paid)}</td>
                  <td className="p-3 text-right font-bold text-amber-600">{formatCurrency(c.unpaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default FinanceCustomerTab;
