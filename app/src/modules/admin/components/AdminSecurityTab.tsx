import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, Eye, EyeOff, Save, RotateCcw, Loader2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { SIDEBAR_CONFIG, ROLE_LABELS, MODULE_LABELS, setRuntimePermissions, getRolesForModule } from '../../../config/sidebar';
import { Role } from '../../../types/user.types';
import api from '../../../services/api';
import RoleDescriptions from './RoleDescriptions';

interface AdminSecurityTabProps {
  pendingCount: number;
  onViewPending: () => void;
}

const ALL_ROLES: Role[] = ['super_admin', 'admin', 'lead', 'staff', 'nv_san_xuat', 'nv_tron_nguyen_lieu', 'nv_chuan_bi_hang', 'driver', 'nv_tai_xe', 'pending'];

const ROLE_COLORS: Record<Role, string> = {
  super_admin: 'text-indigo-600 bg-indigo-50',
  admin: 'text-blue-600 bg-blue-50',
  lead: 'text-rose-600 bg-rose-50',
  staff: 'text-emerald-600 bg-emerald-50',
  nv_san_xuat: 'text-orange-600 bg-orange-50',
  nv_tron_nguyen_lieu: 'text-cyan-600 bg-cyan-50',
  nv_chuan_bi_hang: 'text-violet-600 bg-violet-50',
  driver: 'text-amber-600 bg-amber-50',
  nv_tai_xe: 'text-red-600 bg-red-50',
  pending: 'text-slate-400 bg-slate-50',
};

const AdminSecurityTab: React.FC<AdminSecurityTabProps> = ({ pendingCount, onViewPending }) => {
  // Local state for the permission matrix (editable)
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current permissions
  const loadPermissions = useCallback(() => {
    const current: Record<string, string[]> = {};
    SIDEBAR_CONFIG.forEach(item => {
      current[item.id] = [...getRolesForModule(item.id)];
    });
    setMatrix(current);
    setDirty(false);
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Toggle a permission cell
  const togglePermission = (moduleId: string, role: Role) => {
    // super_admin always has access to everything — cannot be removed
    if ((role as string) === 'super_admin') return;
    // admin module is locked to super_admin only
    if (moduleId === 'admin') return;

    setMatrix(prev => {
      const updated = { ...prev };
      const roles = [...(updated[moduleId] || [])];
      const idx = roles.indexOf(role);
      if (idx >= 0) {
        roles.splice(idx, 1);
      } else {
        roles.push(role);
      }
      updated[moduleId] = roles;
      return updated;
    });
    setDirty(true);
    setMessage(null);
  };

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await api.put<Record<string, string[]>>('/admin/permissions', { permissions: matrix });
      setRuntimePermissions(result);
      setDirty(false);
      setMessage({ type: 'success', text: 'Đã lưu phân quyền thành công! Sidebar sẽ cập nhật khi refresh.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lưu thất bại' });
    } finally {
      setSaving(false);
    }
  };

  // Reset to current saved state
  const handleReset = () => {
    loadPermissions();
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 border-t-4 border-rose-500">
          <div className="p-3 bg-rose-50 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="font-bold text-slate-900">Tài khoản chờ duyệt</h3>
          <p className="text-sm text-slate-500">Thành viên mới đăng ký qua Gmail cần được phê duyệt và gán vai trò trước khi truy cập hệ thống.</p>
          <div className="flex justify-between items-end">
            <span className="text-4xl font-black text-rose-600">{pendingCount}</span>
            <Button size="sm" onClick={onViewPending} className="bg-rose-600 shadow-sm">Xem ngay</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-t-4 border-indigo-500">
          <div className="p-3 bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-900">Phân quyền hệ thống</h3>
          <p className="text-sm text-slate-500">Click vào ô bên dưới để ẩn/hiện module cho từng vai trò. Nhấn <b>Lưu thay đổi</b> để áp dụng.</p>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map(role => (
              <span key={role} className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Permission Matrix — EDITABLE */}
      <Card className="overflow-hidden border-none shadow-lg">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" /> Ma trận phân quyền — Module × Vai trò
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Click vào ô <b>Hiện/Ẩn</b> để thay đổi quyền truy cập. Super Admin luôn có toàn quyền.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Hoàn tác
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                dirty
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>

        {/* Success/Error message */}
        {message && (
          <div className={`px-6 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100' : 'bg-red-50 text-red-700 border-b border-red-100'}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[200px]">Module</th>
                {ALL_ROLES.map(role => (
                  <th key={role} className="px-4 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {SIDEBAR_CONFIG.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-100 rounded-lg">
                        <item.icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{MODULE_LABELS[item.id] || item.id}</span>
                    </div>
                  </td>
                  {ALL_ROLES.map(role => {
                    const hasAccess = (matrix[item.id] || []).includes(role);
                    const isLocked = (role as string) === 'super_admin' || (item.id === 'admin' && (role as string) !== 'super_admin');

                    return (
                      <td key={role} className="px-4 py-3 text-center">
                        <button
                          onClick={() => !isLocked && togglePermission(item.id, role)}
                          disabled={isLocked}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${
                             isLocked
                              ? hasAccess
                                ? 'text-indigo-400 bg-indigo-50/70 cursor-not-allowed'
                                : 'text-slate-200 bg-slate-50 cursor-not-allowed'
                              : hasAccess
                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:shadow-sm cursor-pointer'
                                : 'text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-400 cursor-pointer'
                          }`}
                          title={isLocked ? 'Không thể thay đổi' : `Click để ${hasAccess ? 'ẩn' : 'hiện'}`}
                        >
                          {hasAccess ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {hasAccess ? 'Hiện' : 'Ẩn'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <RoleDescriptions matrix={matrix} roleColors={ROLE_COLORS} />
    </div>
  );
};

export default AdminSecurityTab;
