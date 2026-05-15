import React, { useState, useMemo } from 'react';
import { Users, Shield, Database, Search, UserPlus, Lock, Unlock, MoreVertical, History, Activity, UserCheck, UserX } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAdmin } from './hooks/useAdmin';
import { adminService } from './services/admin.service';
import { UserProfile, Role, UserStatus } from '../../types/user.types';
import { UserRoleBadge, UserStatusBadge } from './components/StatusBadges';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../utils/format';
import AdminLogsTab from './components/AdminLogsTab';
import AdminSecurityTab from './components/AdminSecurityTab';
import { useSocket } from '../../hooks/useSocket';
import { SIDEBAR_CONFIG, ROLE_LABELS, getVisibleModules } from '../../config/sidebar';

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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('admin.title')}</h2>
          <p className="text-slate-500 text-sm font-medium">{t('admin.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2 border-slate-200"><Database className="w-4 h-4" /><span>{t('admin.backup')}</span></Button>
          <Button className="gap-2 bg-indigo-600 shadow-lg shadow-indigo-200"><UserPlus className="w-4 h-4" /><span>{t('admin.invite_user')}</span></Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('admin.total_users'), value: kpis.total, icon: Users, color: 'indigo' },
          { label: t('admin.active_users'), value: kpis.active, icon: UserCheck, color: 'emerald' },
          { label: t('admin.pending_users'), value: kpis.pending, icon: History, color: 'amber' },
          { label: t('admin.blocked_users'), value: kpis.blocked, icon: UserX, color: 'rose' },
        ].map((k, i) => (
          <Card key={i} className={`p-4 bg-white border-l-4 border-${k.color}-500`}>
            <div className="flex justify-between items-start">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{k.label}</p><p className="text-2xl font-black text-slate-900">{k.value}</p></div>
              <k.icon className={`w-5 h-5 text-${k.color}-400`} />
            </div>
          </Card>
        ))}
      </div>

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
                <option value="All">{t('common.all')}</option><option value="super_admin">{t('roles.super_admin')}</option><option value="admin">{t('roles.admin')}</option><option value="staff">{t('roles.staff')}</option><option value="pending">{t('roles.pending')}</option>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">{t('admin.member')}</th><th className="px-6 py-4">{t('admin.department')}</th><th className="px-6 py-4">{t('admin.role')}</th><th className="px-6 py-4">{t('common.status')}</th><th className="px-6 py-4">{t('admin.last_login')}</th><th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">{t('common.no_data')}</td></tr> : filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-slate-100 object-cover" /><div><p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div></div></td>
                      <td className="px-6 py-4">{u.department ? <div><p className="text-xs font-bold text-slate-700">{u.department}</p><p className="text-[10px] text-slate-400 uppercase tracking-tighter">{u.position}</p></div> : <span className="text-[10px] text-slate-300 italic">Chưa cập nhật</span>}</td>
                      <td className="px-6 py-4"><UserRoleBadge role={u.role} /></td>
                      <td className="px-6 py-4"><UserStatusBadge status={u.status} /></td>
                      <td className="px-6 py-4 text-xs text-slate-500">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Chưa đăng nhập'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedUser(u); setIsUpdateRoleOpen(true); }} className="p-1.5 text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-indigo-100 transition-all" title="Thay đổi role"><Shield className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedUser(u); setIsConfirmBlockOpen(true); }} className={`p-1.5 rounded-lg shadow-sm border border-transparent transition-all ${u.status === 'blocked' ? 'text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50' : 'text-rose-600 hover:border-rose-100 hover:bg-rose-50'}`} title={u.status === 'blocked' ? 'Mở khóa' : 'Khóa account'}>{u.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}</button>
                          <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'logs' && <AdminLogsTab loginLogs={loginLogs} activityLogs={activityLogs} />}
      {activeTab === 'security' && <AdminSecurityTab pendingCount={kpis.pending} onViewPending={() => { setRoleFilter('pending'); setActiveTab('users'); }} />}

      {/* Role Update Modal */}
      <Modal isOpen={isUpdateRoleOpen} onClose={() => setIsUpdateRoleOpen(false)} title={`Phân quyền cho: ${selectedUser?.name}`} size="sm">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Chọn vai trò mới. Quyền truy cập module sẽ thay đổi ngay lập tức theo ma trận phân quyền.</p>
          <div className="grid grid-cols-1 gap-2">
            {([
              { role: 'super_admin' as Role, desc: 'Toàn quyền điều hành hệ thống' },
              { role: 'admin' as Role, desc: 'Quản lý nghiệp vụ kinh doanh' },
              { role: 'staff' as Role, desc: 'Nhân viên vận hành sản xuất & kho' },
              { role: 'driver' as Role, desc: 'Tài xế — chỉ dùng app DriverGo' },
              { role: 'pending' as Role, desc: 'Thu hồi quyền — không truy cập được' },
            ]).map(r => {
              const modules = getVisibleModules(r.role);
              const isCurrent = selectedUser?.role === r.role;
              return (
                <button key={r.role} onClick={() => handleUpdateRole(r.role)} className={`p-4 text-left rounded-xl border transition-all ${isCurrent ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900">{ROLE_LABELS[r.role]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">{modules.length}/{SIDEBAR_CONFIG.length} module</span>
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Block Confirmation Modal */}
      <Modal isOpen={isConfirmBlockOpen} onClose={() => setIsConfirmBlockOpen(false)} title={selectedUser?.status === 'blocked' ? "Mở khóa tài khoản" : "Khóa tài khoản"} size="sm"
        footer={<><Button variant="secondary" onClick={() => setIsConfirmBlockOpen(false)}>Hủy</Button><Button className={selectedUser?.status === 'blocked' ? 'bg-emerald-600' : 'bg-rose-600'} onClick={handleToggleBlock}>{selectedUser?.status === 'blocked' ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}</Button></>}>
        <div className="space-y-3">
          <div className={`p-4 rounded-xl flex items-start gap-3 ${selectedUser?.status === 'blocked' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-rose-50 text-rose-900 border border-rose-100'}`}>
            <Shield className="w-5 h-5 shrink-0" />
            <p className="text-sm">Bạn có chắc chắn muốn {selectedUser?.status === 'blocked' ? 'mở khóa' : 'khóa'} tài khoản của <b>{selectedUser?.name}</b>?{selectedUser?.status !== 'blocked' && ' Người dùng sẽ không thể đăng nhập vào hệ thống.'}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;
