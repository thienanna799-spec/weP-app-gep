import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Supplier, PurchaseOrder } from '../services/procurement.service';
import { materialsService } from '../../materials/services/materials.service';

interface Props {
  order: PurchaseOrder | null;
  suppliers: Supplier[];
  onSave: (data: any) => void;
  onClose: () => void;
}

interface ItemRow {
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export default function PurchaseOrderForm({ order, suppliers, onSave, onClose }: Props) {
  const [supplierId, setSupplierId] = useState(order?.supplierId || '');
  const [expectedDate, setExpectedDate] = useState(order?.expectedDate?.slice(0, 10) || '');
  const [notes, setNotes] = useState(order?.notes || '');
  const [items, setItems] = useState<ItemRow[]>(
    order?.items?.map(i => ({
      materialId: i.materialId,
      materialName: i.materialName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unit: i.unit,
    })) || [{ materialId: '', materialName: '', quantity: 0, unitPrice: 0, unit: 'kg' }]
  );
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    materialsService.getAll().then(setMaterials).catch(() => {});
  }, []);

  const addItem = () => setItems(prev => [...prev, { materialId: '', materialName: '', quantity: 0, unitPrice: 0, unit: 'kg' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof ItemRow, value: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [key]: value };
      if (key === 'materialId') {
        const mat = materials.find(m => m.id === value);
        if (mat) {
          updated.materialName = mat.name;
          updated.unitPrice = mat.purchasePrice || 0;
          updated.unit = mat.unit || 'kg';
        }
      }
      return updated;
    }));
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    const validItems = items.filter(i => i.materialId && i.quantity > 0);
    if (validItems.length === 0) return;
    onSave({
      supplierId,
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
      notes: notes || undefined,
      items: validItems,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{order ? 'Sửa đơn mua hàng' : 'Tạo đơn mua hàng'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Supplier + Expected Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nhà cung cấp <span className="text-red-400">*</span></label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">Chọn NCC...</option>
                {suppliers.filter(s => s.isActive).map(s => (
                  <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ngày dự kiến nhận</label>
              <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">Danh sách vật tư <span className="text-red-400">*</span></label>
              <button type="button" onClick={addItem} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus size={12} /> Thêm dòng
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 text-left">Vật tư</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 text-right w-24">Số lượng</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 text-right w-28">Đơn giá</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 text-right w-28">Thành tiền</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">
                        <select value={item.materialId} onChange={e => updateItem(i, 'materialId', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500">
                          <option value="">Chọn...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.quantity || ''} onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.unitPrice || ''} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        {fmt(item.quantity * item.unitPrice)}đ
                      </td>
                      <td className="px-2">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50">
                    <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold text-blue-700 uppercase">Tổng cộng</td>
                    <td className="px-3 py-2.5 text-right text-base font-black text-blue-700">{fmt(total)}đ</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
              {order ? 'Cập nhật' : 'Tạo đơn mua hàng'}
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
