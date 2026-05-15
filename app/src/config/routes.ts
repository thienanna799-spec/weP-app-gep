import { Role } from '../types/user.types';

export interface RouteConfig {
  path: string;
  label: string;
  roles: Role[];
  component: string; // Used for lazy loading mapping or direct reference
}

export const ROUTES_CONFIG: RouteConfig[] = [
  { path: '/dashboard', label: 'Tổng quan', roles: ['super_admin', 'admin', 'staff', 'driver'], component: 'DashboardPage' },
  { path: '/materials', label: 'Nguyên liệu', roles: ['super_admin', 'admin', 'staff'], component: 'MaterialsPage' },
  { path: '/production-orders', label: 'Lệnh sản xuất', roles: ['super_admin', 'admin', 'staff'], component: 'ProductionOrdersPage' },
  { path: '/production', label: 'Sản xuất', roles: ['super_admin', 'admin', 'staff'], component: 'ProductionPage' },
  { path: '/inventory', label: 'Tồn kho', roles: ['super_admin', 'admin', 'staff'], component: 'InventoryPage' },
  { path: '/shipping', label: 'Xuất kho', roles: ['super_admin', 'admin', 'staff'], component: 'ShippingPage' },
  { path: '/orders', label: 'Đơn hàng', roles: ['super_admin', 'admin', 'staff'], component: 'OrdersPage' },
  { path: '/customers', label: 'Khách hàng', roles: ['super_admin', 'admin', 'staff'], component: 'CustomersPage' },
  { path: '/reports', label: 'Báo cáo', roles: ['super_admin', 'admin', 'staff'], component: 'ReportsPage' },
  { path: '/drivers', label: 'Tài xế', roles: ['super_admin', 'admin', 'staff'], component: 'DriversPage' },
  { path: '/finance', label: 'Tài chính', roles: ['super_admin', 'admin'], component: 'FinancePage' }
];
