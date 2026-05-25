/**
 * FinancePage — Main finance dashboard
 * ─────────────────────────────────────
 * Orchestrates tabs. All business logic lives in useFinanceData hook.
 * Each tab is a separate component file.
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowUpCircle, ArrowDownCircle, BarChart3, ShoppingCart, FileText, Users, DollarSign, Truck, CalendarDays, Package } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useFinanceData } from './hooks/useFinanceData';
import type { TabKey } from './types';

// Sub-components
import DateFilterBar from './components/DateFilterBar';
import FinanceKPICards from './components/FinanceKPICards';
import FinanceOverviewTab from './components/FinanceOverviewTab';
import FinanceRevenueTab from './components/FinanceRevenueTab';
import FinanceExpenseTab from './components/FinanceExpenseTab';
import FinanceReceivableTab from './components/FinanceReceivableTab';
import FinancePayableTab from './components/FinancePayableTab';
import FinanceTransactionsTab from './components/FinanceTransactionsTab';
import FinanceCashFlowTab from './components/FinanceCashFlowTab';
import FinanceCustomerTab from './components/FinanceCustomerTab';
import FinanceOperatingCostTab from './components/FinanceOperatingCostTab';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { key: 'revenue', label: 'Doanh thu', icon: ArrowUpCircle },
  { key: 'expense', label: 'Chi phí NL', icon: ArrowDownCircle },
  { key: 'operating', label: 'Vận hành', icon: Truck },
  { key: 'receivable', label: 'Phải thu', icon: ShoppingCart },
  { key: 'payable', label: 'Phải trả', icon: Package },
  { key: 'cashflow', label: 'Dòng tiền', icon: DollarSign },
  { key: 'customers', label: 'Khách hàng', icon: Users },
  { key: 'transactions', label: 'Giao dịch', icon: FileText },
];

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const data = useFinanceData();
  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderPortal(document.getElementById('page-header-portal'));
  }, []);

  if (data.loading) return <LoadingSpinner />;

  const dateFilterPortal = (
    <div className="w-full flex justify-end">
      <DateFilterBar
        datePreset={data.datePreset} setDatePreset={data.setDatePreset}
        dateLabel={data.dateLabel}
        customFrom={data.customFrom} setCustomFrom={data.setCustomFrom}
        customTo={data.customTo} setCustomTo={data.setCustomTo}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      {headerPortal ? ReactDOM.createPortal(dateFilterPortal, headerPortal) : dateFilterPortal}

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 gap-1 overflow-x-auto w-full">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all relative flex items-center gap-1.5 whitespace-nowrap ${activeTab === t.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <FinanceKPICards stats={data.stats} />

      {/* Tab Content */}
      {activeTab === 'overview' && <FinanceOverviewTab stats={data.stats} allTransactions={data.allTransactions} />}
      {activeTab === 'revenue' && <FinanceRevenueTab recentRevenue={data.recentRevenue} totalRevenue={data.stats.totalRevenue} allOrders={data.filteredOrders} />}
      {activeTab === 'expense' && <FinanceExpenseTab recentExpense={data.recentExpense} totalExpense={data.stats.materialExpense} />}
      {activeTab === 'operating' && <FinanceOperatingCostTab fuelLogs={data.filteredFuel} />}
      {activeTab === 'receivable' && <FinanceReceivableTab />}
      {activeTab === 'payable' && <FinancePayableTab />}
      {activeTab === 'cashflow' && <FinanceCashFlowTab orders={data.filteredOrders} materialTxns={data.filteredTxns} fuelLogs={data.filteredFuel} />}
      {activeTab === 'customers' && <FinanceCustomerTab orders={data.filteredOrders} customers={data.customers} />}
      {activeTab === 'transactions' && <FinanceTransactionsTab transactions={data.allTransactions} />}
    </div>
  );
};

export default FinancePage;
