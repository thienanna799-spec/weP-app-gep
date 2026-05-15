/**
 * FinanceRevenueTab — Revenue analysis with charts & table
 * ────────────────────────────────────────────────────────
 * Shows weekly revenue/profit bar chart, customer pie chart,
 * and recent completed orders table.
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ChartZoom from '../../../components/ui/ChartZoom';
import { formatCurrency } from '../../../utils/format';
import { CHART_COLORS } from '../constants';
import type { FinanceOrder } from '../types';

interface Props {
  recentRevenue: FinanceOrder[];
  totalRevenue: number;
  allOrders: FinanceOrder[];
}

const FinanceRevenueTab: React.FC<Props> = ({ recentRevenue, totalRevenue, allOrders }) => {
  const completedOrders = allOrders.filter(o => o.status === 'hoan_thanh');

  const revenueByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    completedOrders.forEach(o => {
      map[o.customerName] = (map[o.customerName] || 0) + (o.totalRevenue || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [completedOrders]);

  const weeklyRevenue = useMemo(() => {
    const map: Record<string, { revenue: number; profit: number; count: number }> = {};
    completedOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!map[key]) map[key] = { revenue: 0, profit: 0, count: 0 };
      map[key].revenue += o.totalRevenue || 0;
      map[key].profit += o.profit || 0;
      map[key].count++;
    });
    return Object.entries(map).map(([week, d]) => ({ week: `W ${week}`, ...d })).slice(-8);
  }, [completedOrders]);

  return (
    <div className="space-y-6">
      {/* Weekly Revenue & Profit Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">📈 Doanh thu & Lợi nhuận theo tuần</h3>
        <p className="text-xs text-slate-400 mb-4">Revenue vs Gross Profit — 8 tuần gần nhất</p>
        <ChartZoom title="Doanh thu & Lợi nhuận theo tuần" height="320px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyRevenue} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
              <Legend />
              <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Lợi nhuận" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartZoom>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Customer Pie */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🏢 Doanh thu theo khách hàng</h3>
          <ChartZoom title="Doanh thu theo khách hàng" height="280px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByCustomer} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#cbd5e1' }}>
                  {revenueByCustomer.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartZoom>
        </Card>

        {/* Revenue Table */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Đơn hàng hoàn thành gần đây</h3>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-indigo-50 text-indigo-800 font-bold text-xs uppercase sticky top-0">
                <tr><th className="p-3">Mã đơn</th><th className="p-3">Khách hàng</th><th className="p-3 text-right">Doanh thu</th><th className="p-3">TT</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRevenue.length === 0
                  ? <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">Chưa có đơn hoàn thành</td></tr>
                  : recentRevenue.map(o => (
                    <tr key={o.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-600 text-xs">{o.code}</td>
                      <td className="p-3 font-medium text-xs">{o.customerName}</td>
                      <td className="p-3 text-right font-bold text-green-600">+{formatCurrency(o.totalRevenue || 0)}</td>
                      <td className="p-3">
                        <Badge variant={o.paymentStatus === 'da_thanh_toan' ? 'green' : 'yellow'}>
                          {o.paymentStatus === 'da_thanh_toan' ? 'Đã TT' : 'Chưa TT'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between text-sm font-bold">
            <span>Tổng doanh thu:</span>
            <span className="text-green-600">{formatCurrency(totalRevenue)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinanceRevenueTab;
