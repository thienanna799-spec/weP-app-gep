/**
 * Finance Module — Shared Types
 * ─────────────────────────────
 * All interfaces used across finance components, hooks, and services.
 */

export interface FinanceOrder {
  id: string;
  code: string;
  customerName: string;
  customerId?: string;
  status: string;
  totalRevenue?: number;
  totalCost?: number;
  profit?: number;
  quantity: number;
  createdAt: string;
  paymentStatus?: string;
  items?: { unitPrice: number; quantity: number; productName: string }[];
}

export interface MaterialTxn {
  id: string;
  type: 'import' | 'export';
  date: string;
  supplier?: string;
  operator?: string;
  notes?: string;
  items: { materialName: string; quantity: number; unitPrice?: number }[];
}

export interface FuelLogEntry {
  id: string;
  amount: number;
  volume: number;
  date: string;
  driverId: string;
}

export interface MaintenanceEntry {
  id: string;
  cost: number;
  date: string;
  type: string;
  vehicleId: string;
}

export interface CustomerEntry {
  id: string;
  name: string;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  date: string;
  desc: string;
  amount: number;
}

export type DatePreset =
  | 'today' | 'yesterday' | 'this_week'
  | 'this_month' | 'last_month' | 'this_quarter'
  | 'this_year' | 'all' | 'custom';

export type TabKey =
  | 'overview' | 'revenue' | 'expense' | 'receivable' | 'payable'
  | 'cashflow' | 'customers' | 'operating' | 'transactions';

export interface FinanceStats {
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  pendingRevenue: number;
  materialExpense: number;
  fuelExpense: number;
  totalExpense: number;
  balance: number;
  profit: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  paidCount: number;
  unpaidCount: number;
}
