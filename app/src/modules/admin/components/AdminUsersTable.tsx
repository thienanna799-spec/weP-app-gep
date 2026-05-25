import React from 'react';
import { Shield, Unlock, Lock, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../../../types/user.types';
import { formatDateTime } from '../../../utils/format';
import { UserRoleBadge, UserStatusBadge } from './StatusBadges';

interface AdminUsersTableProps {
  users: UserProfile[];
  onUpdateRole: (u: UserProfile) => void;
  onToggleBlock: (u: UserProfile) => void;
  onViewInfo: (u: UserProfile) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({ users, onUpdateRole, onToggleBlock, onViewInfo }) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
            <th className="px-6 py-4">{t('admin.member')}</th>
            <th className="px-6 py-4">{t('admin.department')}</th>
            <th className="px-6 py-4">{t('admin.role')}</th>
            <th className="px-6 py-4">{t('common.status')}</th>
            <th className="px-6 py-4">{t('admin.last_login')}</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {users.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">{t('common.no_data')}</td></tr>
          ) : (
            users.slice(0, 100).map(u => (
              <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {u.department ? (
                    <div>
                      <p className="text-xs font-bold text-slate-700">{u.department}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{u.position}</p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 italic">Chưa cập nhật</span>
                  )}
                </td>
                <td className="px-6 py-4"><UserRoleBadge role={u.role} /></td>
                <td className="px-6 py-4"><UserStatusBadge status={u.status} /></td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Chưa đăng nhập'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onUpdateRole(u)} className="p-1.5 text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-indigo-100 transition-all" title="Thay đổi role"><Shield className="w-4 h-4" /></button>
                    <button onClick={() => onToggleBlock(u)} className={`p-1.5 rounded-lg shadow-sm border border-transparent transition-all ${u.status === 'blocked' ? 'text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50' : 'text-rose-600 hover:border-rose-100 hover:bg-rose-50'}`} title={u.status === 'blocked' ? 'Mở khóa' : 'Khóa account'}>
                      {u.status === 'blocked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onViewInfo(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Xem chi tiết"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
