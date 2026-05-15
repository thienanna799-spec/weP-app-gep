import React from 'react';
import Card from '../../../components/ui/Card';
import { ROLE_LABELS, SIDEBAR_CONFIG } from '../../../config/sidebar';
import { Role } from '../../../types/user.types';

interface RoleDescriptionsProps {
  matrix: Record<string, string[]>;
  roleColors: Record<Role, string>;
}

const RoleDescriptions: React.FC<RoleDescriptionsProps> = ({ matrix, roleColors }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">📋 Mô tả vai trò</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { role: 'super_admin' as Role, desc: 'Toàn quyền điều hành hệ thống. Quản lý người dùng, phân quyền, cấu hình hệ thống, tài chính và tất cả module.', color: 'indigo' },
          { role: 'admin' as Role, desc: 'Quản lý nghiệp vụ kinh doanh. Duyệt đơn, quản lý khách hàng, tài xế, tài chính. Không truy cập quản trị hệ thống.', color: 'blue' },
          { role: 'staff' as Role, desc: 'Nhân viên vận hành. Sản xuất, kho hàng, đơn hàng, vận chuyển. Quyền truy cập có thể điều chỉnh ở bảng trên.', color: 'emerald' },
          { role: 'driver' as Role, desc: 'Tài xế giao hàng. Chỉ sử dụng app DriverGo (APK). Có thể bật thêm module web nếu cần.', color: 'amber' },
          { role: 'pending' as Role, desc: 'Tài khoản mới đăng ký chưa được phê duyệt. Không có quyền truy cập bất kỳ module nào.', color: 'slate' },
        ].map(r => {
          const moduleCount = SIDEBAR_CONFIG.filter(i => (matrix[i.id] || []).includes(r.role)).length;
          return (
            <div key={r.role} className={`p-4 rounded-xl border-l-4 border-${r.color}-500 bg-white`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${roleColors[r.role]}`}>
                  {ROLE_LABELS[r.role]}
                </span>
                <span className="text-[10px] font-bold text-slate-400">{moduleCount}/{SIDEBAR_CONFIG.length} module</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RoleDescriptions;
