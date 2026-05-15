import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { Package, TrendingDown, AlertTriangle } from 'lucide-react';
import ChartZoom from '../../../components/ui/ChartZoom';

const STATUS_LABELS: Record<string, string> = { dang_san_xuat: 'Đang SX', trong_kho: 'Trong kho', da_xuat_kho: 'Đã xuất', loi_hong: 'Lỗi/Hỏng', da_giu_cho_don: 'Giữ cho đơn', hoan_tra: 'Hoàn trả' };

interface Props { data: any; loading: boolean }

const InventoryReport: React.FC<Props> = ({ data, loading }) => {
  if (loading || !data) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}</div>;

  const { stockByProduct, stockMovement, slowMoving, turnoverRate, currentStock, totalShipped, statusDistribution } = data;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Tồn kho</p>
          <span className="text-3xl font-black text-emerald-600">{currentStock}</span>
          <p className="text-[10px] text-slate-400">cuộn trong kho</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Đã xuất</p>
          <span className="text-3xl font-black text-blue-600">{totalShipped}</span>
          <p className="text-[10px] text-slate-400">cuộn trong kỳ</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Vòng quay kho</p>
          <span className="text-3xl font-black text-amber-600">{turnoverRate}x</span>
          <p className="text-[10px] text-slate-400">turnover rate</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Tồn lâu</p>
          <span className={`text-3xl font-black ${slowMoving?.length > 10 ? 'text-red-600' : 'text-slate-600'}`}>{slowMoving?.length || 0}</span>
          <p className="text-[10px] text-slate-400">cuộn &gt; 30 ngày</p>
        </div>
      </div>

      {/* Stock by product */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-4">📦 Tồn kho theo sản phẩm</h4>
        <ChartZoom title="Tồn kho theo sản phẩm" height="280px">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockByProduct?.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} name="Số cuộn" />
            </BarChart>
          </ResponsiveContainer>
        </ChartZoom>
      </div>

      {/* Stock movement */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-4">📈 Nhập / Xuất kho theo ngày</h4>
        <ChartZoom title="Nhập / Xuất kho theo ngày" height="260px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockMovement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="inCount" stroke="#22c55e" strokeWidth={2.5} dot={false} name="Nhập kho" />
              <Line type="monotone" dataKey="outCount" stroke="#ef4444" strokeWidth={2} dot={false} name="Xuất kho" />
            </LineChart>
          </ResponsiveContainer>
        </ChartZoom>
      </div>

      {/* Slow moving items */}
      {slowMoving && slowMoving.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Hàng tồn lâu (&gt; 30 ngày)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
                <th className="pb-2 pr-4">Mã cuộn</th><th className="pb-2 pr-4">Sản phẩm</th><th className="pb-2 pr-4">Quy cách</th><th className="pb-2">Ngày nhập</th><th className="pb-2">Số ngày</th>
              </tr></thead>
              <tbody>
                {slowMoving.slice(0, 15).map((r: any) => {
                  const days = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / 86400000);
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4 font-mono text-xs">{r.id}</td>
                      <td className="py-2 pr-4">{r.productName}</td>
                      <td className="py-2 pr-4">{r.specification}</td>
                      <td className="py-2">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${days > 60 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{days} ngày</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
