export type OrderStatus = 
  | 'nhap'
  | 'cho_duyet'
  | 'da_duyet'
  | 'tu_choi'
  | 'dang_chuan_bi'
  | 'cho_xuat_kho'
  | 'dang_giao'
  | 'hoan_thanh'
  | 'huy';

export type OrderPriority = 'thap' | 'trung_binh' | 'cao' | 'khan_cap';

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  note?: string;
  sku?: string;
  subSku?: string;
}

export interface OrderLog {
  id: string;
  orderId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  status: OrderStatus;
  priority: OrderPriority;
  note?: string;
  quantity: number;
  deliveryDeadline?: string;
  approvedBy?: string;
  approvedByName?: string;
  createdBy: string;
  createdByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Financial
  totalRevenue?: number;
  totalCost?: number;
  profit?: number;
  paymentStatus?: string;
}
