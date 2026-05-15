import React, { useState, useEffect, useCallback } from 'react';
import { Download, Factory, Package, Truck, Users, BarChart3, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { useSocket } from '../../hooks/useSocket';
import ReportFilters, { ReportFilterValues } from './components/ReportFilters';
import SummaryCards from './components/SummaryCards';
import ProductionReport from './components/ProductionReport';
import InventoryReport from './components/InventoryReport';
import DeliveryReport from './components/DeliveryReport';
import CustomerReport from './components/CustomerReport';
import SmartAlerts from './components/SmartAlerts';

type TabKey = 'production' | 'materials' | 'inventory' | 'delivery' | 'customers';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'production', label: 'Sản lượng', icon: Factory },
  { key: 'materials', label: 'Nguyên liệu', icon: Layers },
  { key: 'inventory', label: 'Tồn kho', icon: Package },
  { key: 'delivery', label: 'Giao hàng', icon: Truck },
  { key: 'customers', label: 'Khách hàng', icon: Users },
];

function buildQuery(filters: ReportFilterValues): string {
  const p = new URLSearchParams();
  if (filters.from) p.set('from', filters.from);
  if (filters.to) p.set('to', filters.to);
  if (filters.machine) p.set('machine', filters.machine);
  if (filters.productType) p.set('productType', filters.productType);
  if (filters.customerId) p.set('customerId', filters.customerId);
  if (filters.driverId) p.set('driverId', filters.driverId);
  return p.toString();
}

const ReportsPage: React.FC = () => {
  const now = new Date();
  const [filters, setFilters] = useState<ReportFilterValues>({
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
    machine: '', productType: '', customerId: '', driverId: '',
  });

  const [activeTab, setActiveTab] = useState<TabKey>('production');
  const [summary, setSummary] = useState<any>(null);
  const [tabData, setTabData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTab, setLoadingTab] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await api.get(`/reports/summary?${buildQuery(filters)}`);
      setSummary(data);
    } catch (e) { console.error('Summary fetch error:', e); }
    setLoadingSummary(false);
  }, [filters]);

  const fetchTabData = useCallback(async () => {
    setLoadingTab(true);
    try {
      const data = await api.get(`/reports/${activeTab}?${buildQuery(filters)}`);
      setTabData(data);
    } catch (e) { console.error('Tab data fetch error:', e); }
    setLoadingTab(false);
  }, [activeTab, filters]);

  const refreshAll = useCallback(() => {
    setLastUpdate(new Date());
    fetchSummary();
    fetchTabData();
  }, [fetchSummary, fetchTabData]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTabData(); }, [fetchTabData]);

  // Socket.IO: auto-refresh on any data change
  useSocket({
    onOrderUpdate: () => refreshAll(),
    onInventoryUpdate: () => refreshAll(),
    onShippingUpdate: () => refreshAll(),
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get<{ data: any[]; fileName: string }>(`/reports/export/${activeTab}?${buildQuery(filters)}`);
      if (res.data && res.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(res.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');
        ws['!cols'] = Object.keys(res.data[0]).map(k => ({ wch: Math.max(k.length, 15) }));
        XLSX.writeFile(wb, `${res.fileName}_${filters.from}_${filters.to}.xlsx`);
      }
    } catch (e) { console.error('Export error:', e); alert('Lỗi xuất Excel!'); }
    setExporting(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'production': return <ProductionReport data={tabData} loading={loadingTab} />;
      case 'materials': return <MaterialsTab data={tabData} loading={loadingTab} />;
      case 'inventory': return <InventoryReport data={tabData} loading={loadingTab} />;
      case 'delivery': return <DeliveryReport data={tabData} loading={loadingTab} />;
      case 'customers': return <CustomerReport data={tabData} loading={loadingTab} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" /> Báo cáo & Thống kê
          </h2>
          <p className="text-gray-500 text-sm">
            Phân tích hiệu suất vận hành — cập nhật lúc {lastUpdate.toLocaleTimeString('vi-VN')}
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="gap-2">
          <Download className="w-4 h-4" /> {exporting ? 'Đang xuất...' : 'Xuất Excel'}
        </Button>
      </div>

      <ReportFilters filters={filters} onChange={setFilters} />
      <SummaryCards data={summary} loading={loadingSummary} />
      {summary?.alerts && <SmartAlerts alerts={summary.alerts} />}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setTabData(null); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  isActive ? 'text-blue-600 border-blue-600 bg-blue-50/50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
        <div className="p-6">{renderTabContent()}</div>
      </div>
    </div>
  );
};

// ─── Inline Materials Tab ─────────────────────────────────────────────────
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ChartZoom from '../../components/ui/ChartZoom';

const MaterialsTab: React.FC<{ data: any; loading: boolean }> = ({ data, loading }) => {
  if (loading || !data) return <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />)}</div>;

  const { materialUsage, lowStock, totalTransactions, totalEstimatedCost } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Giao dịch NVL</p>
          <span className="text-3xl font-black text-slate-900">{totalTransactions}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-500 uppercase">Chi phí ước tính</p>
          <span className="text-2xl font-black text-blue-600">₱{(totalEstimatedCost || 0).toLocaleString('en-PH')}</span>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <p className="text-xs font-bold text-red-500 uppercase">NVL thiếu</p>
          <span className="text-3xl font-black text-red-600">{lowStock?.length || 0}</span>
        </div>
      </div>

      {materialUsage && materialUsage.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4">📊 Tiêu thụ NVL (Thực tế vs Kế hoạch)</h4>
          <ChartZoom title="Tiêu thụ NVL (Thực tế vs Kế hoạch)" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialUsage.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
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
    </div>
  );
};

export default ReportsPage;
