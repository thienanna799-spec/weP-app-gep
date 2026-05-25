import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
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
import MaterialsTab from './components/MaterialsTab';

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

  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderPortal(document.getElementById('page-header-portal'));
  }, []);

  const topControlBar = (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
      <div className="flex-1 w-full max-w-4xl">
        <ReportFilters filters={filters} onChange={setFilters} />
      </div>
      <Button onClick={handleExport} disabled={exporting} className="gap-2 shrink-0 h-10 bg-indigo-600 hover:bg-indigo-700 shadow-sm">
        <Download className="w-4 h-4" /> {exporting ? 'Đang xuất...' : 'Xuất Excel'}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {headerPortal ? ReactDOM.createPortal(topControlBar, headerPortal) : topControlBar}

      <div className="shrink-0">
        <SummaryCards data={summary} loading={loadingSummary} />
      </div>

      {summary?.alerts && summary.alerts.length > 0 && (
        <div className="shrink-0">
          <SmartAlerts alerts={summary.alerts} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
        <div className="flex border-b border-slate-200 overflow-x-auto shrink-0">
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
        <div className="p-6 flex-1 overflow-auto custom-scrollbar">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default ReportsPage;
