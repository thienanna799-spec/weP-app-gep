import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Supplier } from '../services/procurement.service';

interface Props {
  supplier: Supplier | null;
  onSave: (data: Partial<Supplier>) => void;
  onClose: () => void;
}

export default function SupplierForm({ supplier, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: supplier?.name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    contactPerson: supplier?.contactPerson || '',
    taxCode: supplier?.taxCode || '',
    bankAccount: supplier?.bankAccount || '',
    bankName: supplier?.bankName || '',
    rating: supplier?.rating || 5,
    notes: supplier?.notes || '',
    isActive: supplier?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{supplier ? 'Sửa NCC' : 'Thêm NCC mới'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên NCC <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Người liên hệ</label>
              <input value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Điện thoại</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mã số thuế</label>
              <input value={form.taxCode} onChange={e => set('taxCode', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Địa chỉ</label>
              <input value={form.address} onChange={e => set('address', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Số TK ngân hàng</label>
              <input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ngân hàng</label>
              <input value={form.bankName} onChange={e => set('bankName', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-500">Đánh giá:</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} type="button" onClick={() => set('rating', i)}
                    className={`w-7 h-7 rounded-lg text-sm font-bold transition-all ${i <= form.rating ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 ml-auto cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-medium text-gray-600">Hoạt động</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
              {supplier ? 'Cập nhật' : 'Tạo NCC'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors">
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
