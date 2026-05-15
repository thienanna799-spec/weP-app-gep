/**
 * FinanceOperatingCostTab — Fuel & operating expenses
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Card from '../../../components/ui/Card';
import ChartZoom from '../../../components/ui/ChartZoom';
import { formatCurrency } from '../../../utils/format';

interface Props {
  fuelLogs: { id: string; amount: number; volume: number; date: string; driverId: string }[];
}

const FinanceOperatingCostTab: React.FC<Props> = ({ fuelLogs }) => {
  const totalFuel = fuelLogs.reduce((s, f) => s + (f.amount || 0), 0);
  const totalVolume = fuelLogs.reduce((s, f) => s + (f.volume || 0), 0);
  const avgPerEntry = fuelLogs.length > 0 ? totalFuel / fuelLogs.length : 0;

  const weeklyFuel = useMemo(() => {
    const map: Record<string, { week: string; amount: number; volume: number; count: number }> = {};
    fuelLogs.forEach(f => {
      const d = new Date(f.date);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!map[key]) map[key] = { week: `W ${key}`, amount: 0, volume: 0, count: 0 };
      map[key].amount += f.amount || 0;
      map[key].volume += f.volume || 0;
      map[key].count++;
    });
    return Object.values(map).slice(-8);
  }, [fuelLogs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-t-4 border-orange-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng chi xăng dầu</p>
          <p className="text-xl font-black text-orange-600">{formatCurrency(totalFuel)}</p>
        </Card>
        <Card className="p-4 text-center border-t-4 border-blue-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng lít</p>
          <p className="text-xl font-black text-blue-600">{totalVolume.toFixed(1)} L</p>
        </Card>
        <Card className="p-4 text-center border-t-4 border-purple-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Số lần đổ</p>
          <p className="text-xl font-black text-purple-600">{fuelLogs.length}</p>
        </Card>
        <Card className="p-4 text-center border-t-4 border-green-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase">TB / lần đổ</p>
          <p className="text-xl font-black text-green-600">{formatCurrency(avgPerEntry)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">⛽ Chi phí xăng dầu theo tuần</h3>
        <p className="text-xs text-slate-400 mb-4">Fuel Cost Weekly Trend</p>
        {weeklyFuel.length === 0 ? (
          <p className="text-center text-gray-400 italic py-12">Chưa có dữ liệu xăng dầu trong khoảng thời gian này</p>
        ) : (
          <ChartZoom title="Chi phí xăng dầu theo tuần" height="320px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyFuel} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={(v: number, name: string) => name === 'Lít' ? `${v.toFixed(1)} L` : formatCurrency(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
                <Legend />
                <Bar dataKey="amount" name="Chi phí" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartZoom>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Lịch sử đổ xăng gần đây</h3>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-orange-800 font-bold text-xs uppercase sticky top-0">
              <tr><th className="p-3">Ngày</th><th className="p-3 text-right">Số tiền</th><th className="p-3 text-right">Lít</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fuelLogs.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-gray-400 italic">Chưa có dữ liệu</td></tr> :
                fuelLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map(f => (
                  <tr key={f.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-3 text-xs text-slate-500">{new Date(f.date).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3 text-right font-bold text-orange-600">{formatCurrency(f.amount)}</td>
                    <td className="p-3 text-right font-bold text-blue-600">{f.volume?.toFixed(1) || '0'} L</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between text-sm font-bold">
          <span>Tổng chi xăng dầu:</span>
          <span className="text-orange-600">{formatCurrency(totalFuel)}</span>
        </div>
      </Card>
    </div>
  );
};

export default FinanceOperatingCostTab;
