import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Vehicle, VehicleStatus } from '../types';
import { VEHICLE_STATUS_LABELS } from '../constants';

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: Partial<Vehicle>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<Partial<Vehicle>>(initialData || {
    status: 'available',
    currentMileage: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'capacity' || name === 'year' || name === 'currentMileage' ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Biển số xe" name="plateNumber" value={formData.plateNumber || ''} onChange={handleChange} required placeholder="29A-123.45" />
        <Input label="Loại xe" name="type" value={formData.type || ''} onChange={handleChange} required placeholder="Tải 5 tấn, Xe Van..." />
        <Input label="Tải trọng (kg)" name="capacity" type="number" value={formData.capacity || ''} onChange={handleChange} />
        <Input label="Năm sản xuất" name="year" type="number" value={formData.year || ''} onChange={handleChange} />
        <Input label="Số km hiện tại" name="currentMileage" type="number" value={formData.currentMileage || ''} onChange={handleChange} />
        <Input label="Ngày đăng kiểm" name="registrationDate" type="date" value={formData.registrationDate || ''} onChange={handleChange} />
        <Input label="Hạn bảo hiểm" name="insuranceExpiry" type="date" value={formData.insuranceExpiry || ''} onChange={handleChange} />
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Trạng thái</label>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            className="w-full flex h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {Object.entries(VEHICLE_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <Input label="Tình trạng xe" name="condition" value={formData.condition || ''} onChange={handleChange} placeholder="Tốt, có vết xước..." />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Ghi chú</label>
        <textarea 
          name="notes" 
          value={formData.notes || ''} 
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
