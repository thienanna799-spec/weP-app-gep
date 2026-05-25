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
    <div className="space-y-3">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng cuộn</p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className="text-xl font-black text-slate-900 leading-none">{totalRolls}</span>
            {comparison && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${comparison.change > 0 ? 'bg-green-50 text-green-600' : comparison.change < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                {comparison.change > 0 ? <TrendingUp className="w-3 h-3 inline" /> : comparison.change < 0 ? <TrendingDown className="w-3 h-3 inline" /> : <Minus className="w-3 h-3 inline" />}
                {' '}{comparison.change > 0 ? '+' : ''}{comparison.change}%
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">so với kỳ trước: {comparison?.previous || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Cuộn / ngày</p>
          <span className="text-xl font-black text-blue-600 leading-none mt-1 block">{rollsPerDay}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tỷ lệ OK</p>
          <span className="text-xl font-black text-emerald-600 leading-none mt-1 block">
            {totalRolls > 0 ? Math.round(((totalRolls - (byStatus?.find((s: any) => s.status === 'loi_hong')?.count || 0)) / totalRolls) * 100) : 0}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Daily trend line chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:shadow-md transition-shadow lg:col-span-6">
          <h4 className="text-xs font-bold text-slate-800 mb-1">📈 Sản lượng theo ngày</h4>
          <ChartZoom title="Sản lượng theo ngày" height="180px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '11px', padding: '4px 8px', border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} iconSize={8} />
                <Line type="monotone" dataKey="ok" stroke="#22c55e" strokeWidth={2} dot={false} name="OK" />
                <Line type="monotone" dataKey="defect" stroke="#ef4444" strokeWidth={2} dot={false} name="Lỗi/Hỏng" />
              </LineChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>
        {/* By machine bar chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:shadow-md transition-shadow lg:col-span-3">
          <h4 className="text-xs font-bold text-slate-800 mb-1">🏭 Theo máy / khu vực</h4>
          <ChartZoom title="Theo máy / khu vực" height="180px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMachine} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '11px', padding: '4px 8px', border: '1px solid #e2e8f0' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Số cuộn" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>

        {/* By status pie chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:shadow-md transition-shadow lg:col-span-3">
          <h4 className="text-xs font-bold text-slate-800 mb-1">📊 Phân bổ trạng thái</h4>
          <ChartZoom title="Phân bổ trạng thái" height="180px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie data={byStatus?.map((s: any) => ({ ...s, name: STATUS_LABELS[s.status] || s.status }))} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={50} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} stroke="none" labelStyle={{ fontSize: '9px' }}>
                  {byStatus?.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '11px', padding: '4px 8px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>
      </div>
    </div>
  );
};

export default ProductionReport;
