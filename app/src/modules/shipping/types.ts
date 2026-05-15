export type ShippingStatus = 
  | 'cho_xuat_kho'
  | 'dang_chuan_bi'
  | 'da_xuat_kho'
  | 'da_ban_giao'
  | 'dang_giao'
  | 'giao_thanh_cong'
  | 'giao_that_bai'
  | 'hoan_tra';

export interface ShippingOrderItem {
  id: string;
  shippingOrderId: string;
  rollId: string;
  qrCode: string;
  productName: string;
  specification: string;
  status: 'exported' | 'delivered' | 'returned';
}

export interface DeliveryLog {
  id: string;
  shippingOrderId: string;
  driverId: string;
  action: string;
  note: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  imageUrl?: string;
  signatureUrl?: string;
  createdAt: string;
}

export interface ShippingOrder {
  id: string;
  code: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalRolls: number;
  totalQuantity: number;
  status: ShippingStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedVehicle?: string;
  deliveryDeadline?: string;
  shippedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failReason?: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
