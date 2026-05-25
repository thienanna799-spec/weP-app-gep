import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShoppingBag, AlertTriangle, Layers, Truck } from 'lucide-react';
import ChartZoom from '../../../components/ui/ChartZoom';
import SuppliersTab from '../../procurement/components/SuppliersTab';
import PurchaseOrdersTab from '../../procurement/components/PurchaseOrdersTab';
import LowStockTab from '../../procurement/components/LowStockTab';

type ProcurementSubTab = 'overview' | 'suppliers' | 'purchase-orders' | 'low-stock';

interface MaterialsTabProps {
  data: any;
  loading: boolean;
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({ data, loading }) => {
  const [procurementTab, setProcurementTab] = React.useState<ProcurementSubTab>('overview');
  const [lowStockCount, setLowStockCount] = React.useState(0);

  // Simple toast for procurement sub-tabs
  const toastRef = React.useRef({ current: 0 });
  const [toasts, setToasts] = React.useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const toast = React.useMemo(() => ({
    success: (msg: string) => {
      const id = ++toastRef.current;
      setToasts(prev => [...prev, { id, message: msg, type: 'success' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    },
    error: (msg: string) => {
      const id = ++toastRef.current;
      setToasts(prev => [...prev, { id, message: msg, type: 'error' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    },
    toasts,
  }), [toasts]);

  if (loading || !data) return <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}</div>;

  const { materialUsage, lowStock, totalTransactions, totalEstimatedCost } = data;

  const PROC_TABS: { id: ProcurementSubTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Tổng quan NVL', icon: Layers },
    { id: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
    { id: 'purchase-orders', label: 'Đơn mua hàng', icon: ShoppingBag },
    { id: 'low-stock', label: 'NVL sắp hết', icon: AlertTriangle, badge: lowStockCount },
  ];

  return (
    <div className="space-y-4">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in ${
              t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {t.type === 'success' ? '✓ ' : '✗ '}{t.message}
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {PROC_TABS.map(t => {
          const Icon = t.icon;
          const isActive = procurementTab === t.id;
          return (
            <button key={t.id} onClick={() => setProcurementTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview = original Materials content */}
      {procurementTab === 'overview' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Giao dịch NVL</p>
              <span className="text-2xl font-black text-slate-900 block mt-1 leading-none">{totalTransactions}</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Chi phí ước tính</p>
              <span className="text-2xl font-black text-blue-600 block mt-1 leading-none">₱{(totalEstimatedCost || 0).toLocaleString('en-PH')}</span>
            </div>
            <div className="bg-white rounded-xl border border-red-100 px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold text-red-500 uppercase">NVL thiếu</p>
              <span className="text-2xl font-black text-red-600 block mt-1 leading-none">{lowStock?.length || 0}</span>
            </div>
          </div>

          {materialUsage && materialUsage.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <h4 className="text-sm font-bold text-slate-800 mb-2">📊 Tiêu thụ NVL (Thực tế vs Kế hoạch)</h4>
              <ChartZoom title="Tiêu thụ NVL (Thực tế vs Kế hoạch)" height="200px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={materialUsage.slice(0, 10)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="exported" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Thực tế" />
                    <Bar dataKey="planned" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Kế hoạch" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartZoom>
            </div>
          )}

          {lowStock && lowStock.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 p-5">
              <h4 className="text-sm font-bold text-red-800 mb-3">⚠️ Nguyên liệu dưới mức tối thiểu</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
                    <th className="pb-2 pr-4">Tên</th><th className="pb-2 pr-4">Tồn</th><th className="pb-2 pr-4">Tối thiểu</th><th className="pb-2">Thiếu</th>
                  </tr></thead>
                  <tbody>
                    {lowStock.map((m: any) => (
                      <tr key={m.id} className="border-b border-slate-50">
                        <td className="py-2 pr-4 font-medium">{m.name}</td>
                        <td className="py-2 pr-4">{m.currentStock}</td>
                        <td className="py-2 pr-4">{m.minStock}</td>
                        <td className="py-2"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{Math.max(0, m.minStock - m.currentStock)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Procurement sub-tabs */}
      {procurementTab === 'suppliers' && <SuppliersTab toast={toast as any} />}
      {procurementTab === 'purchase-orders' && <PurchaseOrdersTab toast={toast as any} />}
      {procurementTab === 'low-stock' && <LowStockTab toast={toast as any} onCountUpdate={setLowStockCount} />}

      {/* Hidden LowStockTab to track count */}
      {procurementTab !== 'low-stock' && (
        <div className="hidden">
          <LowStockTab toast={{ success: () => {}, error: () => {}, toasts: [] } as any} onCountUpdate={setLowStockCount} />
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;
