export const UserRole = {
  super_admin: 'super_admin',
  admin: 'admin',
  staff: 'staff',
  driver: 'driver',
  pending: 'pending',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  active: 'active',
  blocked: 'blocked',
  pending: 'pending',
  inactive: 'inactive',
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const CustomerType = {
  ca_nhan: 'ca_nhan',
  doanh_nghiep: 'doanh_nghiep',
} as const;
export type CustomerType = typeof CustomerType[keyof typeof CustomerType];

export const PaymentMethod = {
  cod: 'cod',
  bank_transfer: 'bank_transfer',
  credit: 'credit',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const OrderStatus = {
  nhap: 'nhap',
  cho_duyet: 'cho_duyet',
  da_duyet: 'da_duyet',
  tu_choi: 'tu_choi',
  dang_chuan_bi: 'dang_chuan_bi',
  cho_xuat_kho: 'cho_xuat_kho',
  dang_giao: 'dang_giao',
  hoan_thanh: 'hoan_thanh',
  huy: 'huy',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const OrderPriority = {
  thap: 'thap',
  trung_binh: 'trung_binh',
  cao: 'cao',
  khan_cap: 'khan_cap',
} as const;
export type OrderPriority = typeof OrderPriority[keyof typeof OrderPriority];

export const MaterialStatus = {
  con_hang: 'con_hang',
  sap_het: 'sap_het',
  het_hang: 'het_hang',
  ngung_dung: 'ngung_dung',
} as const;
export type MaterialStatus = typeof MaterialStatus[keyof typeof MaterialStatus];

export const ProductionOrderStatus = {
  waiting_material: 'waiting_material',
  ready: 'ready',
  producing: 'producing',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;
export type ProductionOrderStatus = typeof ProductionOrderStatus[keyof typeof ProductionOrderStatus];

export const RollStatus = {
  dang_san_xuat: 'dang_san_xuat',
  trong_kho: 'trong_kho',
  da_giu_cho_don: 'da_giu_cho_don',
  da_xuat_kho: 'da_xuat_kho',
  loi_hong: 'loi_hong',
  hoan_tra: 'hoan_tra',
} as const;
export type RollStatus = typeof RollStatus[keyof typeof RollStatus];

export const ShippingStatus = {
  cho_xuat_kho: 'cho_xuat_kho',
  dang_chuan_bi: 'dang_chuan_bi',
  da_xuat_kho: 'da_xuat_kho',
  da_ban_giao_tai_xe: 'da_ban_giao_tai_xe',
  dang_giao: 'dang_giao',
  giao_thanh_cong: 'giao_thanh_cong',
  giao_that_bai: 'giao_that_bai',
  hoan_tra: 'hoan_tra',
} as const;
export type ShippingStatus = typeof ShippingStatus[keyof typeof ShippingStatus];

export const DriverStatus = {
  available: 'available',
  delivering: 'delivering',
  leave: 'leave',
  inactive: 'inactive',
  blocked: 'blocked',
} as const;
export type DriverStatus = typeof DriverStatus[keyof typeof DriverStatus];

export const VehicleStatus = {
  available: 'available',
  in_use: 'in_use',
  maintenance: 'maintenance',
  broken: 'broken',
  inactive: 'inactive',
} as const;
export type VehicleStatus = typeof VehicleStatus[keyof typeof VehicleStatus];

export const AuditReviewStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  escalated: 'escalated',
} as const;
export type AuditReviewStatus = typeof AuditReviewStatus[keyof typeof AuditReviewStatus];

export const PurchaseOrderStatus = {
  draft: 'draft',
  pending_approval: 'pending_approval',
  approved: 'approved',
  ordered: 'ordered',
  partially_received: 'partially_received',
  received: 'received',
  cancelled: 'cancelled',
} as const;
export type PurchaseOrderStatus = typeof PurchaseOrderStatus[keyof typeof PurchaseOrderStatus];

export const FollowUpType = {
  call: 'call',
  email: 'email',
  visit: 'visit',
  quote: 'quote',
  other: 'other',
} as const;
export type FollowUpType = typeof FollowUpType[keyof typeof FollowUpType];

export const FollowUpStatus = {
  pending: 'pending',
  completed: 'completed',
  cancelled: 'cancelled',
  overdue: 'overdue',
} as const;
export type FollowUpStatus = typeof FollowUpStatus[keyof typeof FollowUpStatus];
