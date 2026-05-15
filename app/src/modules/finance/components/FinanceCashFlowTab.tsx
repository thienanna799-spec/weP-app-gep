/**
 * FinanceCashFlowTab — Cash flow analysis
 * ────────────────────────────────────────
 * Weekly income vs expense area chart with net flow line.
 */

import React, { useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Line, Area, AreaChart,
} from 'recharts';
import Card from '../../../components/ui/Card';
import ChartZoom from '../../../components/ui/ChartZoom';
import { formatCurrency } from '../../../utils/format';

interface Props {
  orders: { id: string; status: string; totalRevenue?: number; createdAt: string; paymentStatus?: string }[];
  materialTxns: { id: string; type: string; date: string; items: { quantity: number; unitPrice?: number }[] }[];
  fuelLogs: { id: string; amount: number; date: string }[];
}

const FinanceCashFlowTab: React.FC<Props> = ({ orders, materialTxns, fuelLogs }) => {
  const weeklyData = useMemo(() => {
    const map: Record<string, { week: string; income: number; expense: number; net: number }> = {};

    const getWeekKey = (d: Date) => {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      return `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    // Income from paid orders
    orders.filter(o => o.paymentStatus === 'da_thanh_toan' && o.totalRevenue).forEach(o => {
      const key = getWeekKey(new Date(o.createdAt));
      if (!map[key]) map[key] = { week: `W ${key}`, income: 0, expense: 0, net: 0 };
      map[key].income += o.totalRevenue || 0;
    });

    // Expense from materials
    materialTxns.filter(t => t.type === 'import').forEach(t => {
      const key = getWeekKey(new Date(t.date));
      if (!map[key]) map[key] = { week: `W ${key}`, income: 0, expense: 0, net: 0 };
      map[key].expense += t.items.reduce((s, i) => s + (i.quantity * (i.unitPrice || 0)), 0);
    });

    // Expense from fuel
    fuelLogs.forEach(f => {
      const key = getWeekKey(new Date(f.date));
      if (!map[key]) map[key] = { week: `W ${key}`, income: 0, expense: 0, net: 0 };
      map[key].expense += f.amount || 0;
    });

    return Object.values(map).map(d => ({ ...d, net: d.income - d.expense })).slice(-12);
  }, [orders, materialTxns, fuelLogs]);

  const totalIn = weeklyData.reduce((s, d) => s + d.income, 0);
  const totalOut = weeklyData.reduce((s, d) => s + d.expense, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-green-500 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng thu</p>
          <p className="text-xl font-black text-green-600">{formatCurrency(totalIn)}</p>
        </Card>
        <Card className="p-5 border-l-4 border-red-500 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng chi</p>
          <p className="text-xl font-black text-red-600">{formatCurrency(totalOut)}</p>
        </Card>
        <Card className="p-5 border-l-4 border-blue-500 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Dòng tiền ròng</p>
          <p className={`text-xl font-black ${totalIn - totalOut >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(totalIn - totalOut)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">💰 Dòng tiền theo tuần</h3>
        <p className="text-xs text-slate-400 mb-4">Cash Flow — Thu nhập vs Chi phí vs Ròng</p>
        {weeklyData.length === 0 ? (
          <p className="text-center text-gray-400 italic py-12">Chưa có dữ liệu dòng tiền trong khoảng thời gian này</p>
        ) : (
          <ChartZoom title="Dòng tiền theo tuần" height="350px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                <Legend />
                <Area type="monotone" dataKey="income" name="Thu" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Chi" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                <Line type="monotone" dataKey="net" name="Ròng" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartZoom>
        )}
      </Card>
    </div>
  );
};

export default FinanceCashFlowTab;
