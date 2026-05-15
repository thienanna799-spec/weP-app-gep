import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Driver, DriverStatus } from '../types';
import { DRIVER_STATUS_LABELS } from '../constants';

interface DriverFormProps {
  initialData?: Driver;
  onSubmit: (data: Partial<Driver>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DriverForm: React.FC<DriverFormProps> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<Partial<Driver>>(initialData || {
    status: 'available',
    joinedDate: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Mã tài xế" name="code" value={formData.code || ''} onChange={handleChange} required placeholder="TX-001" />
        <Input label="Họ và tên" name="name" value={formData.name || ''} onChange={handleChange} required />
        <Input label="Số điện thoại" name="phone" value={formData.phone || ''} onChange={handleChange} required />
        <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
        <Input label="Ngày sinh" name="dob" type="date" value={formData.dob || ''} onChange={handleChange} />
        <Input label="CCCD" name="idCard" value={formData.idCard || ''} onChange={handleChange} />
        <Input label="Số bằng lái" name="licenseNo" value={formData.licenseNo || ''} onChange={handleChange} />
        <Input label="Loại bằng lái" name="licenseType" value={formData.licenseType || ''} onChange={handleChange} placeholder="B2, C..." />
        <Input label="Ngày hết hạn bằng lái" name="licenseExpiry" type="date" value={formData.licenseExpiry || ''} onChange={handleChange} />
        <Input label="Ngày vào làm" name="joinedDate" type="date" value={formData.joinedDate || ''} onChange={handleChange} />
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Trạng thái</label>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            className="w-full flex h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50"
          >
            {Object.entries(DRIVER_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
        <textarea 
          name="address" 
          value={formData.address || ''} 
          onChange={handleChange}
          className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button type="submit" loading={loading}>{initialData ? 'Cập nhật' : 'Thêm mới'}</Button>
      </div>
    </form>
  );
};
