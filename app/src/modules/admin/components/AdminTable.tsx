import React from 'react';
import { useUsers } from '../../../hooks/useUsers';
import { updateUserRole, updateUserStatus } from '../../../services/userService';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { ROLE_LABELS } from '../../../utils/constants';

const AdminTable: React.FC = () => {
  const { users } = useUsers();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Người dùng</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <select 
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-sm outline-none"
                  value={u.role}
                  onChange={(e) => updateUserRole(u.uid, e.target.value as any)}
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4">
                <Badge variant={u.status === 'blocked' ? 'red' : 'green'}>
                  {u.status === 'active' ? 'Hoạt động' : u.status === 'blocked' ? 'Bị khóa' : 'Chờ duyệt'}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => updateUserStatus(u.uid, u.status === 'blocked' ? 'active' : 'blocked')}
                  className={`text-xs font-bold ${u.status === 'blocked' ? 'text-green-600' : 'text-red-600'} hover:underline`}
                >
                  {u.status === 'blocked' ? 'Mở khóa' : 'Khóa'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default AdminTable;
