import { LayoutDashboard, Package, ClipboardList, QrCode, Search, Truck, ShoppingCart, FileText, Users, Shield, UserCheck, Boxes, DollarSign } from 'lucide-react';
import { Role } from '../types/user.types';

export interface SidebarItem {
  id: string;
  labelKey: string;
  icon: any;
  path: string;
  defaultRoles: Role[];
}

// ── Default permission matrix (compile-time fallback) ─────
// This is used when the server hasn't responded yet or no DB override exists.
export const SIDEBAR_CONFIG: SidebarItem[] = [
  { id: 'dashboard',         labelKey: 'nav.dashboard',          icon: LayoutDashboard, path: '/dashboard',          defaultRoles: ['super_admin', 'admin', 'staff'] },
  { id: 'customers',         labelKey: 'nav.customers',          icon: UserCheck,       path: '/customers',          defaultRoles: ['super_admin', 'admin'] },
  { id: 'materials',         labelKey: 'nav.materials',          icon: Package,         path: '/materials',          defaultRoles: ['super_admin', 'admin', 'staff'] },
  { id: 'production_orders', labelKey: 'nav.production_orders',  icon: ClipboardList,   path: '/production-orders',  defaultRoles: ['super_admin', 'admin', 'staff'] },
  { id: 'production',        labelKey: 'nav.production',         icon: QrCode,          path: '/production',         defaultRoles: ['super_admin', 'admin', 'staff'] },
  { id: 'inventory',         labelKey: 'nav.inventory',          icon: Search,          path: '/inventory',          defaultRoles: ['super_admin', 'admin', 'staff'] },
  { id: 'orders',            labelKey: 'nav.orders',             icon: ShoppingCart,     path: '/orders',             defaultRoles: ['super_admin', 'admin', 'staff'] },
  { id: 'shipping',          labelKey: 'nav.shipping',           icon: Truck,           path: '/shipping',           defaultRoles: ['super_admin', 'admin', 'staff'] },
  { id: 'drivers',           labelKey: 'nav.drivers',            icon: Users,           path: '/drivers',            defaultRoles: ['super_admin', 'admin'] },
  { id: 'reports',           labelKey: 'nav.reports',            icon: FileText,        path: '/reports',            defaultRoles: ['super_admin', 'admin'] },
  { id: 'finance',           labelKey: 'nav.finance',            icon: DollarSign,      path: '/finance',            defaultRoles: ['super_admin', 'admin'] },
  { id: 'admin',             labelKey: 'nav.admin',              icon: Shield,          path: '/admin',              defaultRoles: ['super_admin'] },
];

// ── Runtime permission state ─────────────────────────────
// Loaded from API at app startup, merged with defaults.
let _runtimePermissions: Record<string, string[]> | null = null;

export function setRuntimePermissions(perms: Record<string, string[]>) {
  _runtimePermissions = perms;
}

export function getRolesForModule(moduleId: string): Role[] {
  if (_runtimePermissions && _runtimePermissions[moduleId]) {
    return _runtimePermissions[moduleId] as Role[];
  }
  const item = SIDEBAR_CONFIG.find(i => i.id === moduleId);
  return item?.defaultRoles || [];
}

export function isModuleAllowed(moduleId: string, role: Role): boolean {
  return getRolesForModule(moduleId).includes(role);
}

export function getVisibleModules(role: Role): SidebarItem[] {
  return SIDEBAR_CONFIG.filter(item => isModuleAllowed(item.id, role));
}

// ── Human-readable labels ─────────────────────────────────
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  lead: 'Lead (Chỉ huy kho)',
  staff: 'Nhân viên',
  nv_san_xuat: 'NV Sản xuất',
  nv_tron_nguyen_lieu: 'NV Trộn nguyên liệu',
  nv_chuan_bi_hang: 'NV Chuẩn bị hàng',
  driver: 'Tài xế',
  nv_tai_xe: 'NV Tài xế',
  pending: 'Chờ duyệt',
};

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  customers: 'Khách hàng',
  materials: 'Nguyên liệu',
  production_orders: 'Lệnh sản xuất',
  production: 'Sản xuất',
  inventory: 'Kho hàng',
  orders: 'Đơn hàng',
  shipping: 'Vận chuyển',
  drivers: 'Tài xế',
  reports: 'Báo cáo',

  finance: 'Tài chính',
  admin: 'Quản trị',
};
