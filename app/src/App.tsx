import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './hooks/useAuth';

// Layouts
import AppLayout from './components/layout/AppLayout';
import LoginPage from './views/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages (Lazy Loaded from modular structure)
import * as Modules from './modules/index';
import UnauthorizedPage from './modules/error/UnauthorizedPage';
import NotFoundPage from './modules/error/NotFoundPage';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import { LogOut } from 'lucide-react';
import { logout } from './services/authService';
import { getRolesForModule, setRuntimePermissions } from './config/sidebar';
import RoleGuard from './components/auth/RoleGuard';
import api from './services/api';
import { useSocket } from './hooks/useSocket';

const App: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();

  // Load permissions from API on startup
  const loadPermissions = () => {
    if (user) {
      api.get<Record<string, string[]>>('/admin/permissions')
        .then(perms => setRuntimePermissions(perms))
        .catch(() => { /* use defaults */ });
    }
  };

  useEffect(() => { loadPermissions(); }, [user]);

  // Real-time: auto-reload permissions when admin changes them
  useSocket({
    onUserUpdate: (data: any) => {
      if (data?.type === 'permissions_changed' || data?.type === 'role_changed') {
        loadPermissions();
      }
    },
  });

  if (loading) return <LoadingSpinner />;

  // Helper: get allowed roles for a module (reads from runtime permissions)
  const rolesFor = (id: string) => getRolesForModule(id);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          
          {/* Blocked Account */}
          <Route path="/blocked" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-inter">
              <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-red-600">{t('auth.account_blocked')}</h1>
                  <p className="text-gray-600">{t('auth.contact_admin')}</p>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <Button onClick={logout} variant="secondary" className="w-full gap-2 font-bold">
                    <LogOut className="w-4 h-4" /> {t('auth.logout_switch')}
                  </Button>
                </div>
              </Card>
            </div>
          } />

          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Main Layout Routes */}
          <Route element={
            <ProtectedRoute>
              <AppLayout profile={profile!} />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('dashboard')}><Modules.DashboardPage /></RoleGuard>} />
            <Route path="/materials" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('materials')}><Modules.MaterialsPage /></RoleGuard>} />
            <Route path="/production-orders" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('production_orders')}><Modules.ProductionOrdersPage profile={profile!} /></RoleGuard>} />
            <Route path="/production" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('production')}><Modules.ProductionPage profile={profile!} /></RoleGuard>} />
            <Route path="/inventory" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('inventory')}><Modules.InventoryPage /></RoleGuard>} />
            <Route path="/shipping" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('shipping')}><Modules.ShippingPage profile={profile!} /></RoleGuard>} />
            <Route path="/orders" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('orders')}><Modules.OrdersPage profile={profile!} /></RoleGuard>} />
            <Route path="/customers" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('customers')}><Modules.CustomersPage /></RoleGuard>} />
            <Route path="/reports" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('reports')}><Modules.ReportsPage /></RoleGuard>} />
            <Route path="/drivers" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('drivers')}><Modules.DriversPage /></RoleGuard>} />
            <Route path="/procurement" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('procurement')}><Modules.ProcurementPage /></RoleGuard>} />
            <Route path="/finance" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('finance')}><Modules.FinancePage /></RoleGuard>} />
            <Route path="/admin" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('admin')}><Modules.AdminPage /></RoleGuard>} />
            <Route path="/ocr-audit" element={<RoleGuard userRole={profile?.role || 'pending'} allowedRoles={rolesFor('ocr_audit')}><Modules.OcrAuditPage /></RoleGuard>} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
