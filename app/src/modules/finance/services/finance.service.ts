/**
 * Finance Service — API client for finance endpoints
 * All data is fetched real-time from backend.
 */
import api from '../../../services/api';

export interface Receivable {
  orderId: string;
  orderCode: string;
  customerId: string | null;
  customerName: string;
  customer: { id: string; name: string; creditLimit: number; creditDays: number; telegramChatId?: string } | null;
  totalRevenue: number;
  totalPaid: number;
  remaining: number;
  daysSinceCreated: number;
  isOverdue: boolean;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  reference?: string;
  note?: string;
  paidAt: string;
  recordedByName?: string;
}

export interface Payable {
  id: string;
  code: string;
  supplier: { id: string; name: string; code: string } | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface CreditCheck {
  customerId: string;
  customerName: string;
  creditLimit: number;
  creditDays: number;
  currentDebt: number;
  availableCredit: number | null;
  isOverLimit: boolean;
}

export const financeService = {
  getSummary: () => api.get<any>('/finance/summary'),
  getReceivables: () => api.get<Receivable[]>('/finance/receivables'),
  getCustomerReceivable: (customerId: string) => api.get<any>(`/finance/receivables/${customerId}`),
  createPayment: (data: { orderId: string; amount: number; method: string; reference?: string; note?: string }) =>
    api.post<any>('/finance/payments', data),
  getOrderPayments: (orderId: string) => api.get<{ payments: PaymentRecord[]; totalRevenue: number; totalPaid: number; remaining: number }>(`/finance/payments/${orderId}`),
  getPayables: () => api.get<{ orders: Payable[]; totalPayable: number }>('/finance/payables'),
  checkCredit: (customerId: string) => api.get<CreditCheck>(`/finance/credit-check/${customerId}`),
  sendDebtAlerts: () => api.post<any>('/finance/debt-alerts', {}),
};
