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
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Tổng đơn giao</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{total}</span>
            {comparison && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${comparison.change > 0 ? 'bg-green-50 text-green-600' : comparison.change < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                {comparison.change > 0 ? '+' : ''}{comparison.change}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-5">
          <p className="text-xs font-bold text-green-500 uppercase">Thành công</p>
          <span className="text-3xl font-black text-green-600">{delivered}</span>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <p className="text-xs font-bold text-red-500 uppercase">Thất bại</p>
          <span className="text-3xl font-black text-red-600">{failed}</span>
        </div>
        <div className="bg-white rounded-2xl border border-blue-100 p-5">
          <p className="text-xs font-bold text-blue-500 uppercase">Tỷ lệ thành công</p>
          <span className={`text-3xl font-black ${onTimeRate >= 80 ? 'text-green-600' : onTimeRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{onTimeRate}%</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> TB giao hàng</p>
          <span className="text-3xl font-black text-indigo-600">{avgDeliveryHours}h</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4">📊 Phân bổ trạng thái giao hàng</h4>
          <ChartZoom title="Phân bổ trạng thái giao hàng" height="260px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                  label={({ status, percent }: any) => `${status} ${(percent * 100).toFixed(0)}%`}>
                  {statusDistribution?.map((d: any, i: number) => <Cell key={i} fill={d.color || ['#22c55e', '#3b82f6', '#ef4444', '#94a3b8'][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartZoom>
        </div>

        {/* By driver */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4">🚗 Hiệu suất theo tài xế</h4>
          {byDriver && byDriver.length > 0 ? (
            <ChartZoom title="Hiệu suất theo tài xế" height="260px">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDriver} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
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
