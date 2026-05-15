/**
 * Customer Module – Types & Interfaces
 * ─────────────────────────────────────────────────────────
 * Includes CRM types for notes, follow-ups, and activities.
 */

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address: string;

  // CRM fields
  dateOfOrigin?: string;
  recipientName?: string;
  groupName?: string;
  groupChatLink?: string;
  operatingPlatform?: string;
  customerCharacteristics?: string;
  gipCode?: string;
  product?: string;
  operationalStatus: 'active' | 'inactive' | 'stopped';
  boss?: string;
  cessationDate?: string;
  tag?: string;
  googleMapsLink?: string;

  // Legacy
  province?: string;
  district?: string;
  customerType: 'ca_nhan' | 'doanh_nghiep';
  company?: string;
  taxCode?: string;
  contactPerson?: string;
  preferredPayment: 'cod' | 'bank_transfer' | 'credit';
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountHolder?: string;
  telegramChatId?: string;
  notes?: string;
  isActive: boolean;
  creditLimit: number;
  creditDays: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
  orders?: CustomerOrder[];
  pricingRules?: PricingRule[];
}

export interface PricingRule {
  id: string;
  sku: string;
  price: number;
  isActive: boolean;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: string;
}

export interface CustomerOrder {
  id: string;
  code: string;
  status: string;
  priority?: string;
  customerName?: string;
  quantity?: number;
  totalRevenue: number | null;
  totalCost?: number | null;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  deliveryDeadline?: string | null;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  title: string;
  description?: string;
  dueDate: string;
  type: 'call' | 'email' | 'visit' | 'quote' | 'other';
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  createdBy: string;
  createdByName: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
}

export interface CustomerActivity {
  id: string;
  customerId: string;
  type: string; // note_added, followup_created, followup_completed, order_created
  title: string;
  description?: string;
  metadata?: any;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CrmProfile {
  customer: Customer;
  notes: CustomerNote[];
  followUps: CustomerFollowUp[];
  activities: CustomerActivity[];
  orders: CustomerOrder[];
  stats: {
    totalOrders: number;
    totalQuantity: number;
    totalRevenue: number;
  };
}

export interface CustomerHistory {
  customer: {
    id: string;
    name: string;
    code: string;
    totalOrders: number;
    totalRevenue: number;
    createdAt: string;
  };
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalQuantity: number;
    totalRevenue: number;
    lastOrderDate: string | null;
    lastOrderStatus: string | null;
  };
  orders: CustomerOrder[];
}

export type CustomerFormData = Omit<Customer, 'id' | 'code' | 'createdAt' | 'updatedAt' | '_count' | 'orders' | 'totalOrders' | 'totalRevenue' | 'isActive'>;

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BankAccountFormData = Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>;

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  ca_nhan: 'Cá nhân',
  doanh_nghiep: 'Doanh nghiệp',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'COD (Thu hộ)',
  bank_transfer: 'Chuyển khoản',
  credit: 'Công nợ',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  chua_thanh_toan: 'Chưa thanh toán',
  da_thanh_toan: 'Đã thanh toán',
  thanh_toan_mot_phan: 'Thanh toán một phần',
};

export const FOLLOWUP_TYPE_LABELS: Record<string, string> = {
  call: 'Gọi điện',
  email: 'Gửi email',
  visit: 'Đến thăm',
  quote: 'Gửi báo giá',
  other: 'Khác',
};

export const FOLLOWUP_TYPE_ICONS: Record<string, string> = {
  call: '📞',
  email: '✉️',
  visit: '🏢',
  quote: '📄',
  other: '📋',
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  note_added: 'Thêm ghi chú',
  followup_created: 'Tạo lịch nhắc',
  followup_completed: 'Hoàn thành nhắc việc',
  order_created: 'Tạo đơn hàng',
  status_changed: 'Đổi trạng thái',
};

export const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  note_added: 'bg-yellow-500',
  followup_created: 'bg-blue-500',
  followup_completed: 'bg-green-500',
  order_created: 'bg-purple-500',
  status_changed: 'bg-orange-500',
};

// ── CRM Constants ────────────────────────────────────────

export const OPERATIONAL_STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Tạm dừng',
  stopped: 'Đã ngừng',
};

export const OPERATIONAL_STATUS_COLORS: Record<string, string> = {
  active: 'emerald',
  inactive: 'amber',
  stopped: 'red',
};

export const PLATFORM_OPTIONS = [
  'Shopee', 'Lazada', 'Tiki', 'TikTok Shop',
  'Facebook', 'Zalo', 'Instagram', 'Website',
  'Offline', 'Other',
];
