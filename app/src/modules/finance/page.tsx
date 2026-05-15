/**
 * FinancePage — Main finance dashboard
 * ─────────────────────────────────────
 * Orchestrates tabs. All business logic lives in useFinanceData hook.
 * Each tab is a separate component file.
 */

import React, { useState } from 'react';
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

  if (data.loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Tài chính</h2>
          <p className="text-gray-500 text-sm">Theo dõi dòng tiền, công nợ và lợi nhuận</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="font-medium">{data.dateLabel}</span>
        </div>
      </div>

      {/* Date Filter */}
      <DateFilterBar
        datePreset={data.datePreset} setDatePreset={data.setDatePreset}
        customFrom={data.customFrom} setCustomFrom={data.setCustomFrom}
        customTo={data.customTo} setCustomTo={data.setCustomTo}
      />

      {/* KPI Cards */}
      <FinanceKPICards stats={data.stats} />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`pb-3 px-3 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === t.key ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
            {activeTab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

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
