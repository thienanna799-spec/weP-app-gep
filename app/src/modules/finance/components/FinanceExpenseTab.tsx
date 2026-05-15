/**
 * FinanceExpenseTab — Material expense analysis
 * ──────────────────────────────────────────────
 * Shows expense by supplier pie chart and recent import transactions.
 */

import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Card from '../../../components/ui/Card';
import ChartZoom from '../../../components/ui/ChartZoom';
import { formatCurrency } from '../../../utils/format';
import { CHART_COLORS, fmtShortDate } from '../constants';
import type { MaterialTxn } from '../types';

interface Props {
  recentExpense: MaterialTxn[];
  totalExpense: number;
}

const FinanceExpenseTab: React.FC<Props> = ({ recentExpense, totalExpense }) => {
  const expenseBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    recentExpense.forEach(t => {
      const supplier = t.supplier || 'Không rõ';
      map[supplier] = (map[supplier] || 0) + t.items.reduce((s, i) => s + (i.quantity * (i.unitPrice || 0)), 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [recentExpense]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Chi phí theo NCC</h3>
          <ChartZoom title="Chi phí theo NCC" height="280px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseBySupplier} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expenseBySupplier.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </ChartZoom>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📦 Phiếu nhập kho gần đây</h3>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-red-50 text-red-800 font-bold text-xs uppercase sticky top-0">
                <tr><th className="p-3">Ngày</th><th className="p-3">NCC</th><th className="p-3">NL</th><th className="p-3 text-right">Tiền</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentExpense.length === 0
                  ? <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">Chưa có phiếu nhập kho</td></tr>
                  : recentExpense.map(t => (
                    <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="p-3 text-gray-500 text-xs">{fmtShortDate(t.date)}</td>
                      <td className="p-3 font-medium text-xs">{t.supplier || '---'}</td>
                      <td className="p-3 text-gray-600 text-xs">{t.items.map(i => i.materialName).join(', ').slice(0, 30)}</td>
                      <td className="p-3 text-right font-bold text-red-600">-{formatCurrency(t.items.reduce((s, i) => s + (i.quantity * (i.unitPrice || 0)), 0))}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between text-sm font-bold">
            <span>Tổng chi phí:</span>
            <span className="text-red-600">{formatCurrency(totalExpense)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinanceExpenseTab;
