import { 
  LayoutDashboard, 
  Package, 
  QrCode, 
  Search, 
  Truck, 
  ShoppingCart, 
  FileText, 
  AlertCircle,
  Users,
  ClipboardList
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { id: 'materials', labelKey: 'nav.materials', icon: Package },
  { id: 'production_orders', labelKey: 'nav.production_orders', icon: ClipboardList },
  { id: 'production', labelKey: 'nav.production', icon: QrCode },
  { id: 'inventory', labelKey: 'nav.inventory', icon: Search },
  { id: 'shipping', labelKey: 'nav.shipping', icon: Truck },
  { id: 'orders', labelKey: 'nav.orders', icon: ShoppingCart },
  { id: 'reports', labelKey: 'nav.reports', icon: FileText },
  { id: 'drivers', labelKey: 'nav.drivers', icon: Truck },
  { id: 'finance', labelKey: 'nav.finance', icon: AlertCircle },
];

// Role labels are now accessed via t('roles.xxx') in components
export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Nhân viên',
  driver: 'Tài xế',
  pending: 'Chờ duyệt',
};

// Status labels — components should use t('status.xxx') instead of these
export const STATUS_DATA = {
  pending: { labelKey: 'status.cho_duyet', color: 'yellow' },
  approved: { labelKey: 'status.da_duyet', color: 'blue' },
  ready_to_print: { labelKey: 'status.cho_xuat_kho', color: 'orange' },
  shipping: { labelKey: 'status.dang_giao', color: 'purple' },
  completed: { labelKey: 'status.hoan_thanh', color: 'green' },
  rejected: { labelKey: 'status.huy', color: 'red' },
};

export const PRODUCTION_ORDER_STATUS_DATA = {
  waiting_material: { labelKey: 'production_orders.waiting_material', color: 'yellow' },
  ready: { labelKey: 'production_orders.ready', color: 'blue' },
  producing: { labelKey: 'production_orders.producing', color: 'orange' },
  completed: { labelKey: 'production_orders.completed', color: 'green' },
  cancelled: { labelKey: 'production_orders.cancelled', color: 'red' },
};
