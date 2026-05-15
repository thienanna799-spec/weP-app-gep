import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ChartZoom from '../../../components/ui/ChartZoom';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_LABELS: Record<string, string> = { dang_san_xuat: 'Đang SX', trong_kho: 'Trong kho', da_xuat_kho: 'Đã xuất', loi_hong: 'Lỗi/Hỏng', da_giu_cho_don: 'Giữ cho đơn', hoan_tra: 'Hoàn trả' };

interface Props { data: any; loading: boolean }

const ProductionReport: React.FC<Props> = ({ data, loading }) => {
  if (loading || !data) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}</div>;

  const { dailyTrend, byMachine, byStatus, totalRolls, rollsPerDay, comparison } = data;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Tổng cuộn</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{totalRolls}</span>
            {comparison && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${comparison.change > 0 ? 'bg-green-50 text-green-600' : comparison.change < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                {comparison.change > 0 ? <TrendingUp className="w-3 h-3 inline" /> : comparison.change < 0 ? <TrendingDown className="w-3 h-3 inline" /> : <Minus className="w-3 h-3 inline" />}
                {' '}{comparison.change > 0 ? '+' : ''}{comparison.change}%
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">so với kỳ trước: {comparison?.previous || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Cuộn / ngày</p>
          <span className="text-3xl font-black text-blue-600">{rollsPerDay}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Tỷ lệ OK</p>
          <span className="text-3xl font-black text-emerald-600">
            {totalRolls > 0 ? Math.round(((totalRolls - (byStatus?.find((s: any) => s.status === 'loi_hong')?.count || 0)) / totalRolls) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Daily trend line chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-4">📈 Sản lượng theo ngày</h4>
        <ChartZoom title="Sản lượng theo ngày" height="280px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Legend />
              <Line type="monotone" dataKey="ok" stroke="#22c55e" strokeWidth={2.5} dot={false} name="OK" />
              <Line type="monotone" dataKey="defect" stroke="#ef4444" strokeWidth={2} dot={false} name="Lỗi/Hỏng" />
            </LineChart>
          </ResponsiveContainer>
        </ChartZoom>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By machine bar chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4">🏭 Theo máy / khu vực</h4>
          <ChartZoom title="Theo máy / khu vực" height="240px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMachine} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Số cuộn" />
              </BarChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>

        {/* By status pie chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4">📊 Phân bổ trạng thái</h4>
          <ChartZoom title="Phân bổ trạng thái" height="240px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus?.map((s: any) => ({ ...s, name: STATUS_LABELS[s.status] || s.status }))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {byStatus?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>
      </div>
    </div>
  );
};

export default ProductionReport;
