import React from 'react';
import { Camera, X } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Material, MaterialGroup, MaterialUnit } from '../types';

const MATERIAL_GROUPS: MaterialGroup[] = [
  'Hạt nhựa', 'Màng PE', 'Giấy carton', 'Băng keo', 'Tem QR', 
  'Bao bì đóng gói', 'Lõi giấy', 'Mực in', 'Pallet', 'Phụ kiện khác'
];

const MATERIAL_UNITS: MaterialUnit[] = ['kg', 'cuộn', 'mét', 'cái', 'thùng', 'pallet', 'lít'];

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMaterial: Material | null;
  formData: Partial<Material>;
  setFormData: (data: Partial<Material>) => void;
  onSave: () => void;
}

const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  isOpen, onClose, editingMaterial, formData, setFormData, onSave
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMaterial ? "Cập nhật Nguyên liệu" : "Thêm Nguyên liệu mới"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button onClick={onSave}>Lưu thông tin</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input 
            label="Mã nguyên liệu" 
            value={formData.code} 
            onChange={(e: any) => setFormData({...formData, code: e.target.value})} 
            placeholder="VD: nhựa-001"
          />
          <Input 
            label="Tên nguyên liệu" 
            value={formData.name} 
            onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
            placeholder="VD: Hạt nhựa tái sinh LDPE"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Nhóm nguyên liệu</label>
            <select 
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
              value={formData.group}
              onChange={(e) => setFormData({...formData, group: e.target.value as MaterialGroup})}
            >
              {MATERIAL_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Đơn vị tính</label>
              <select 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value as MaterialUnit})}
              >
                {MATERIAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <Input 
              label="Giá nhập / đơn vị" 
              type="number" 
              value={formData.purchasePrice} 
              onChange={(e: any) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Tồn hiện tại" 
              type="number" 
              value={formData.currentStock} 
              onChange={(e: any) => setFormData({...formData, currentStock: Number(e.target.value)})}
            />
            <Input 
              label="Tồn tối thiểu" 
              type="number" 
              value={formData.minStock} 
              onChange={(e: any) => setFormData({...formData, minStock: Number(e.target.value)})}
            />
          </div>
          <Input 
            label="Nhà cung cấp" 
            value={formData.supplier} 
            onChange={(e: any) => setFormData({...formData, supplier: e.target.value})}
            placeholder="Tên công ty / đầu mối"
          />
          <Input 
            label="Vị trí lưu kho" 
            value={formData.warehouseLocation} 
            onChange={(e: any) => setFormData({...formData, warehouseLocation: e.target.value})}
            placeholder="VD: Kệ A-01"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Ghi chú</label>
            <textarea 
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors min-h-[80px]"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Ảnh sản phẩm</label>
            {formData.imageUrl ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 group">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({...formData, imageUrl: ''})}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                <Camera className="w-6 h-6 text-slate-300 mb-2" />
                <span className="text-xs text-slate-400 font-medium">Click để chọn ảnh</span>
                <span className="text-[10px] text-slate-300">JPG, PNG, WebP (max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Ảnh không được vượt quá 5MB');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, imageUrl: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MaterialFormModal;
