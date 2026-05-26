import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, Shield, Database, Search, UserPlus, Activity, UserCheck, UserX, History } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAdmin } from './hooks/useAdmin';
import { adminService } from './services/admin.service';
import { UserProfile, Role, UserStatus } from '../../types/user.types';
import { UserRoleBadge, UserStatusBadge } from './components/StatusBadges';
import { useTranslation } from 'react-i18next';
import AdminLogsTab from './components/AdminLogsTab';
import AdminSecurityTab from './components/AdminSecurityTab';
import { useSocket } from '../../hooks/useSocket';
import { AdminUsersTable } from './components/AdminUsersTable';
import { AdminUserModals } from './components/AdminUserModals';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { users, loginLogs, activityLogs, loading, refetch } = useAdmin();

  // Real-time: auto-refresh when APK users register/login or vehicle changes
  useSocket({
    onUserUpdate: () => refetch(),
    onDriverVehicleUpdate: () => refetch(),
  });
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'security'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUpdateRoleOpen, setIsUpdateRoleOpen] = useState(false);
  const [isConfirmBlockOpen, setIsConfirmBlockOpen] = useState(false);
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  const filteredUsers = useMemo(() => users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (roleFilter === 'All' || u.role === roleFilter) && (statusFilter === 'All' || u.status === statusFilter);
  }), [users, searchTerm, roleFilter, statusFilter]);

  const kpis = useMemo(() => ({ total: users.length, active: users.filter(u => u.status === 'active').length, pending: users.filter(u => u.role === 'pending' || u.status === 'pending').length, blocked: users.filter(u => u.status === 'blocked').length }), [users]);

  const handleUpdateRole = async (role: Role) => {
    if (!selectedUser) return;
    try {
      await adminService.updateUserRole(selectedUser.uid, role);
      setIsUpdateRoleOpen(false);
      refetch(); // Refresh table immediately
    } catch (err: any) { alert(err.message); }
  };

  const handleToggleBlock = async () => {
    if (!selectedUser) return;
    try {
      await adminService.updateUserStatus(selectedUser.uid, selectedUser.status === 'blocked' ? 'active' : 'blocked');
      setIsConfirmBlockOpen(false);
      refetch(); // Refresh table immediately
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <LoadingSpinner />;

  const kpiContent = (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-4 mt-2 lg:mt-0">
      {[
        { label: t('admin.total_users'), value: kpis.total, icon: Users, color: 'indigo' },
        { label: t('admin.active_users'), value: kpis.active, icon: UserCheck, color: 'emerald' },
        { label: t('admin.pending_users'), value: kpis.pending, icon: History, color: 'amber' },
        { label: t('admin.blocked_users'), value: kpis.blocked, icon: UserX, color: 'rose' },
      ].map((k, i) => (
        <Card key={i} className={`p-2.5 px-3 bg-white border-l-4 border-${k.color}-500 shadow-sm`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">{k.label}</p>
              <p className="text-xl font-black text-slate-900 leading-none">{k.value}</p>
            </div>
            <div className={`p-1.5 rounded-lg bg-${k.color}-50`}>
              <k.icon className={`w-4 h-4 text-${k.color}-500`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      {mounted && document.getElementById('page-header-portal') 
        ? createPortal(kpiContent, document.getElementById('page-header-portal')!)
        : null}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto custom-scrollbar">
        {[{ id: 'users' as const, label: t('admin.user_management'), icon: Users }, { id: 'logs' as const, label: t('admin.activity_logs'), icon: Activity }, { id: 'security' as const, label: t('admin.system_config'), icon: Shield }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <Card className="p-4 bg-slate-50/50 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder={t('common.search')} className="pl-10 h-10 border-slate-200" value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} /></div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('admin.role')}</label>
              <select className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">{t('common.all')}</option><option value="super_admin">{t('roles.super_admin')}</option><option value="admin">{t('roles.admin')}</option><option value="lead">{t('roles.lead')}</option><option value="staff">{t('roles.staff')}</option><option value="nv_san_xuat">{t('roles.nv_san_xuat')}</option><option value="nv_tron_nguyen_lieu">{t('roles.nv_tron_nguyen_lieu')}</option><option value="nv_chuan_bi_hang">{t('roles.nv_chuan_bi_hang')}</option><option value="driver">{t('roles.driver')}</option><option value="nv_tai_xe">{t('roles.nv_tai_xe')}</option><option value="pending">{t('roles.pending')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('common.status')}</label>
              <select className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">{t('common.all_statuses')}</option><option value="active">{t('status.active')}</option><option value="blocked">{t('status.blocked')}</option><option value="pending">{t('roles.pending')}</option>
              </select>
            </div>
          </Card>

          <Card className="overflow-hidden border-none shadow-md">
            <AdminUsersTable 
              users={filteredUsers}
              onUpdateRole={(u) => { setSelectedUser(u); setIsUpdateRoleOpen(true); }}
              onToggleBlock={(u) => { setSelectedUser(u); setIsConfirmBlockOpen(true); }}
              onViewInfo={(u) => { setSelectedUser(u); setIsUserInfoOpen(true); }}
            />
          </Card>
        </div>
      )}

      {activeTab === 'logs' && <AdminLogsTab loginLogs={loginLogs} activityLogs={activityLogs} />}
      {activeTab === 'security' && <AdminSecurityTab pendingCount={kpis.pending} onViewPending={() => { setRoleFilter('pending'); setActiveTab('users'); }} />}

      <AdminUserModals 
        selectedUser={selectedUser}
        isUpdateRoleOpen={isUpdateRoleOpen} setIsUpdateRoleOpen={setIsUpdateRoleOpen} handleUpdateRole={handleUpdateRole}
        isConfirmBlockOpen={isConfirmBlockOpen} setIsConfirmBlockOpen={setIsConfirmBlockOpen} handleToggleBlock={handleToggleBlock}
        isUserInfoOpen={isUserInfoOpen} setIsUserInfoOpen={setIsUserInfoOpen}
      />
    </div>
  );
};

export default AdminPage;
