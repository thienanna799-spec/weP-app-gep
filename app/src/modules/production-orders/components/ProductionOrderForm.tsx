/**
 * ProductionOrderForm — Create new production order
 */

import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import type { NewOrderFormData } from '../types';

interface Props {
  formData: NewOrderFormData;
  onChange: (data: NewOrderFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ProductionOrderForm: React.FC<Props> = ({ formData, onChange, onSubmit, onCancel }) => {
  const set = (field: keyof NewOrderFormData, value: any) =>
    onChange({ ...formData, [field]: value });

  return (
    <Card className="p-8 border-2 border-blue-100">
      <h4 className="text-xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">
        Thiết lập Lệnh sản xuất mới
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <Input label="Ngày sản xuất" type="date" value={formData.productionDate} onChange={(e: any) => set('productionDate', e.target.value)} />
          <Input label="Deadline hoàn thiện" type="date" value={formData.deadline} onChange={(e: any) => set('deadline', e.target.value)} />
          <Input label="Người phụ trách" value={formData.personInChargeName} onChange={(e: any) => set('personInChargeName', e.target.value)} placeholder="Tên kỹ thuật viên phụ trách" />
        </div>
        <div className="space-y-4">
          <Input label="Tên sản phẩm" value={formData.productName} onChange={(e: any) => set('productName', e.target.value)} placeholder="Ví dụ: Bọc chống sốc 50cm" />
          <Input label="Quy cách (specification)" value={formData.specs} onChange={(e: any) => set('specs', e.target.value)} placeholder="Ví dụ: 50cm x 100m" />
          <Input label="Số lượng cần (kg/m)" type="number" value={formData.requiredQuantity} onChange={(e: any) => set('requiredQuantity', Number(e.target.value))} />
          <Input label="Số cuộn mục tiêu" type="number" value={formData.targetRolls} onChange={(e: any) => set('targetRolls', Number(e.target.value))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Chiều dài / cuộn (m)" type="number" value={formData.rollLength} onChange={(e: any) => set('rollLength', Number(e.target.value))} placeholder="0" />
            <Input label="Trọng lượng / cuộn (kg)" type="number" value={formData.rollWeight} onChange={(e: any) => set('rollWeight', Number(e.target.value))} placeholder="0" />
          </div>
        </div>
        <div className="space-y-4">
          <Input label="Máy / Khu vực sx" value={formData.machineArea} onChange={(e: any) => set('machineArea', e.target.value)} />
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ghi chú vận hành</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 min-h-[100px] text-sm"
              value={formData.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Yêu cầu cụ thể cho xưởng..."
            />
          </div>
        </div>
      </div>
      <div className="mt-10 flex justify-end gap-3 border-t border-gray-100 pt-6">
        <Button variant="secondary" onClick={onCancel} className="px-8">Bỏ qua</Button>
        <Button onClick={onSubmit} className="px-8 bg-blue-600">Khởi tạo Lệnh</Button>
      </div>
    </Card>
  );
};

export default ProductionOrderForm;
