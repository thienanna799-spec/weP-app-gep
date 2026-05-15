import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { suppliersService } from '../services/procurement.service';
import type { Supplier } from '../services/procurement.service';
import SupplierTable from '../components/SupplierTable';
import SupplierForm from '../components/SupplierForm';

interface SuppliersTabProps {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export default function SuppliersTab({ toast }: SuppliersTabProps) {
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await suppliersService.getAll(search || undefined);
      setSuppliers(data);
    } catch { toast.error('Lỗi tải nhà cung cấp'); }
    setLoading(false);
  }, [search, toast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSave = async (data: Partial<Supplier>) => {
    try {
      if (editingSupplier) {
        await suppliersService.update(editingSupplier.id, data);
        toast.success('Cập nhật NCC thành công');
      } else {
        await suppliersService.create(data);
        toast.success('Tạo NCC thành công');
      }
      setShowForm(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (e: any) { toast.error(e?.message || 'Lỗi'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa nhà cung cấp này?')) return;
    try {
      await suppliersService.delete(id);
      toast.success('Đã xóa NCC');
      fetchSuppliers();
    } catch (e: any) { toast.error(e?.message || 'Không thể xóa'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            placeholder="Tìm nhà cung cấp..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => { setEditingSupplier(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Thêm NCC
        </button>
      </div>

      <SupplierTable
        suppliers={suppliers}
        loading={loading}
        onEdit={s => { setEditingSupplier(s); setShowForm(true); }}
        onDelete={handleDelete}
        onRefresh={fetchSuppliers}
      />

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingSupplier(null); }}
        />
      )}
    </div>
  );
}
