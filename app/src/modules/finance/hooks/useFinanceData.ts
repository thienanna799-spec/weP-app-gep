/**
 * Finance Module — useFinanceData Hook
 * ─────────────────────────────────────
 * Fetches all finance data and computes filtered datasets + stats.
 *
 * Flow: Hook → Service (api) → Database
 */

import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { getDateRange } from '../utils/dateRange';
import type {
  FinanceOrder, MaterialTxn, FuelLogEntry,
  CustomerEntry, Transaction, DatePreset, FinanceStats,
} from '../types';

interface UseFinanceDataReturn {
  loading: boolean;
  // Date filter
  datePreset: DatePreset;
  setDatePreset: (p: DatePreset) => void;
  customFrom: string;
  setCustomFrom: (v: string) => void;
  customTo: string;
  setCustomTo: (v: string) => void;
  dateLabel: string;
  // Filtered data
  filteredOrders: FinanceOrder[];
  filteredTxns: MaterialTxn[];
  filteredFuel: FuelLogEntry[];
  customers: CustomerEntry[];
  // Computed
  stats: FinanceStats;
  recentRevenue: FinanceOrder[];
  recentExpense: MaterialTxn[];
  allTransactions: Transaction[];
}

export function useFinanceData(): UseFinanceDataReturn {
  const [orders, setOrders] = useState<FinanceOrder[]>([]);
  const [txns, setTxns] = useState<MaterialTxn[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>([]);
  const [customers, setCustomers] = useState<CustomerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Fetch all data once
  useEffect(() => {
    Promise.all([
      api.get<FinanceOrder[]>('/orders').catch(() => []),
      api.get<MaterialTxn[]>('/materials/transactions').catch(() => []),
      api.get<FuelLogEntry[]>('/fuel-logs').catch(() => []),
      api.get<CustomerEntry[]>('/customers').catch(() => []),
    ])
      .then(([o, t, f, c]) => {
        setOrders(o);
        setTxns(t);
        setFuelLogs(f);
        setCustomers(c);
      })
      .finally(() => setLoading(false));
  }, []);

  // Date range
  const { from: dateFrom, to: dateTo } = useMemo(
    () => getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  const inRange = (d: string) => {
    const dt = new Date(d);
    return dt >= dateFrom && dt <= dateTo;
  };

  const dateLabel = useMemo(() => {
    if (datePreset === 'all') return 'Tất cả thời gian';
    const f = dateFrom.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const t = dateTo.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${f} — ${t}`;
  }, [dateFrom, dateTo, datePreset]);

  // Filtered data
  const filteredOrders = useMemo(() => orders.filter(o => inRange(o.createdAt)), [orders, dateFrom, dateTo]);
  const filteredTxns = useMemo(() => txns.filter(t => inRange(t.date)), [txns, dateFrom, dateTo]);
  const filteredFuel = useMemo(() => fuelLogs.filter(f => inRange(f.date)), [fuelLogs, dateFrom, dateTo]);

  // Stats
  const stats = useMemo<FinanceStats>(() => {
    const revenueOrders = filteredOrders.filter(
      o => ['hoan_thanh', 'dang_giao'].includes(o.status) && (o.totalRevenue || 0) > 0,
    );
    const completedOrders = filteredOrders.filter(o => o.status === 'hoan_thanh');
    const pendingOrders = filteredOrders.filter(
      o => !['hoan_thanh', 'huy', 'tu_choi'].includes(o.status),
    );
    const paidOrders = completedOrders.filter(o => o.paymentStatus === 'da_thanh_toan');
    const unpaidOrders = filteredOrders.filter(
      o => ['hoan_thanh', 'dang_giao'].includes(o.status) &&
        o.paymentStatus !== 'da_thanh_toan' &&
        (o.totalRevenue || 0) > 0,
    );

    const totalRevenue = revenueOrders.reduce((s, o) => s + (o.totalRevenue || 0), 0);
    const paidRevenue = paidOrders.reduce((s, o) => s + (o.totalRevenue || 0), 0);
    const unpaidRevenue = unpaidOrders.reduce((s, o) => s + (o.totalRevenue || 0), 0);

    const importTxns = filteredTxns.filter(t => t.type === 'import');
    const materialExpense = importTxns.reduce(
      (s, t) => s + t.items.reduce((si, i) => si + (i.quantity * (i.unitPrice || 0)), 0), 0,
    );
    const fuelExpense = filteredFuel.reduce((s, f) => s + (f.amount || 0), 0);
    const totalExpense = materialExpense + fuelExpense;

    return {
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      pendingRevenue: pendingOrders.reduce((s, o) => s + (o.totalRevenue || 0), 0),
      materialExpense,
      fuelExpense,
      totalExpense,
      balance: totalRevenue - totalExpense,
      profit: paidRevenue - totalExpense,
      totalOrders: filteredOrders.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      paidCount: paidOrders.length,
      unpaidCount: unpaidOrders.length,
    };
  }, [filteredOrders, filteredTxns, filteredFuel]);

  // Recent revenue orders
  const recentRevenue = useMemo(
    () => filteredOrders
      .filter(o => ['hoan_thanh', 'dang_giao'].includes(o.status) && o.totalRevenue)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    [filteredOrders],
  );

  // Recent expense transactions
  const recentExpense = useMemo(
    () => filteredTxns
      .filter(t => t.type === 'import')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
    [filteredTxns],
  );

  // All transactions (merged revenue + material + fuel)
  const allTransactions = useMemo<Transaction[]>(() => {
    const rev = filteredOrders
      .filter(o => ['hoan_thanh', 'dang_giao'].includes(o.status) && o.totalRevenue)
      .map(o => ({
        id: o.id,
        type: 'income' as const,
        date: o.createdAt,
        desc: `Đơn hàng #${o.code} - ${o.customerName}`,
        amount: o.totalRevenue || 0,
      }));

    const matExp = filteredTxns
      .filter(t => t.type === 'import')
      .map(t => ({
        id: t.id,
        type: 'expense' as const,
        date: t.date,
        desc: `Nhập kho NL${t.supplier ? ` - ${t.supplier}` : ''}`,
        amount: t.items.reduce((s, i) => s + (i.quantity * (i.unitPrice || 0)), 0),
      }));

    const fuelExp = filteredFuel.map(f => ({
      id: f.id,
      type: 'expense' as const,
      date: f.date,
      desc: 'Xăng dầu',
      amount: f.amount || 0,
    }));

    return [...rev, ...matExp, ...fuelExp].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [filteredOrders, filteredTxns, filteredFuel]);

  return {
    loading,
    datePreset, setDatePreset,
    customFrom, setCustomFrom,
    customTo, setCustomTo,
    dateLabel,
    filteredOrders, filteredTxns, filteredFuel, customers,
    stats, recentRevenue, recentExpense, allTransactions,
  };
}
