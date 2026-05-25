import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import ChartZoom from '../../../components/ui/ChartZoom';

interface Props { data: any; loading: boolean }

const DeliveryReport: React.FC<Props> = ({ data, loading }) => {
  if (loading || !data) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}</div>;

  const { total, delivered, failed, inProgress, onTimeRate, avgDeliveryHours, byDriver, statusDistribution, comparison } = data;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng đơn giao</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 leading-none">{total}</span>
            {comparison && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${comparison.change > 0 ? 'bg-green-50 text-green-600' : comparison.change < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                {comparison.change > 0 ? '+' : ''}{comparison.change}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-100 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-green-500 uppercase">Thành công</p>
          <span className="text-2xl font-black text-green-600 block mt-1 leading-none">{delivered}</span>
        </div>
        <div className="bg-white rounded-xl border border-red-100 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-red-500 uppercase">Thất bại</p>
          <span className="text-2xl font-black text-red-600 block mt-1 leading-none">{failed}</span>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Tỷ lệ thành công</p>
          <span className={`text-2xl font-black block mt-1 leading-none ${onTimeRate >= 80 ? 'text-green-600' : onTimeRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{onTimeRate}%</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> TB giao hàng</p>
          <span className="text-2xl font-black text-indigo-600 block mt-1 leading-none">{avgDeliveryHours}h</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <h4 className="text-sm font-bold text-slate-800 mb-2">📊 Phân bổ trạng thái giao hàng</h4>
          <ChartZoom title="Phân bổ trạng thái giao hàng" height="200px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie data={statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={35} stroke="none"
                  label={({ status, percent }: any) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusDistribution?.map((d: any, i: number) => <Cell key={i} fill={d.color || ['#22c55e', '#3b82f6', '#ef4444', '#94a3b8'][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>

        {/* By driver */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
          <h4 className="text-sm font-bold text-slate-800 mb-2">🚗 Hiệu suất theo tài xế</h4>
          {byDriver && byDriver.length > 0 ? (
            <ChartZoom title="Hiệu suất theo tài xế" height="200px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDriver} layout="vertical" margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="delivered" stackId="a" fill="#22c55e" name="Thành công" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Thất bại" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartZoom>
          ) : (
            <p className="text-sm text-slate-400 text-center py-12">Chưa có dữ liệu tài xế</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryReport;
