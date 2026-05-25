import { lazy } from 'react';

export const DashboardPage = lazy(() => import('./dashboard/page'));
export const MaterialsPage = lazy(() => import('./materials/page'));
export const ProductionOrdersPage = lazy(() => import('./production-orders/page'));
export const ProductionPage = lazy(() => import('./production/page'));
export const InventoryPage = lazy(() => import('./inventory/page'));
export const ShippingPage = lazy(() => import('./shipping/page'));
export const OrdersPage = lazy(() => import('./orders/page'));
export const CustomersPage = lazy(() => import('./customers/page'));
export const ReportsPage = lazy(() => import('./reports/page'));
export const DriversPage = lazy(() => import('./drivers/page'));
export const FinancePage = lazy(() => import('./finance/page'));
// Admin view is often special, but let's include it for completeness if needed
export const AdminPage = lazy(() => import('./admin/page'));
