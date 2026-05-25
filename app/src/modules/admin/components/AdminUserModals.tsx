import React from 'react';
import { Shield } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { UserProfile, Role } from '../../../types/user.types';
import { formatDateTime } from '../../../utils/format';
import { UserRoleBadge, UserStatusBadge } from './StatusBadges';
import { SIDEBAR_CONFIG, ROLE_LABELS, getVisibleModules } from '../../../config/sidebar';

interface AdminUserModalsProps {
  selectedUser: UserProfile | null;
  
  // Role Update
  isUpdateRoleOpen: boolean;
  setIsUpdateRoleOpen: (val: boolean) => void;
  handleUpdateRole: (role: Role) => void;

  // Block Toggle
  isConfirmBlockOpen: boolean;
  setIsConfirmBlockOpen: (val: boolean) => void;
  handleToggleBlock: () => void;

  // User Info
  isUserInfoOpen: boolean;
  setIsUserInfoOpen: (val: boolean) => void;
}

export const AdminUserModals: React.FC<AdminUserModalsProps> = ({
  selectedUser,
  isUpdateRoleOpen, setIsUpdateRoleOpen, handleUpdateRole,
  isConfirmBlockOpen, setIsConfirmBlockOpen, handleToggleBlock,
  isUserInfoOpen, setIsUserInfoOpen
}) => {
  return (
    <>
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

      {/* User Info Modal */}
      <Modal isOpen={isUserInfoOpen} onClose={() => setIsUserInfoOpen(false)} title="Thông tin thành viên" size="md">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <img src={selectedUser.avatar} alt={selectedUser.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedUser.name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <UserRoleBadge role={selectedUser.role} />
                  <UserStatusBadge status={selectedUser.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Phòng ban</p>
                <p className="text-sm font-medium text-slate-800">{selectedUser.department || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Chức vụ</p>
                <p className="text-sm font-medium text-slate-800">{selectedUser.position || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Số điện thoại</p>
                <p className="text-sm font-medium text-slate-800">{selectedUser.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Đăng nhập lần cuối</p>
                <p className="text-sm font-medium text-slate-800">{selectedUser.lastLoginAt ? formatDateTime(selectedUser.lastLoginAt) : 'Chưa đăng nhập'}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsUserInfoOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
