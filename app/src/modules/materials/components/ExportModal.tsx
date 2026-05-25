import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Material } from '../types';
import { materialsService } from '../services/materials.service';

interface ExportItem {
  materialId: string;
  materialName: string;
  quantity: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onSuccess: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen, onClose, materials, onSuccess
}) => {
  const { t } = useTranslation();
  const [exportItems, setExportItems] = useState<ExportItem[]>([]);
  const [exportRef, setExportRef] = useState('');
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportNotes, setExportNotes] = useState('');
  const [exportSaving, setExportSaving] = useState(false);

  const handleExport = async () => {
    const validItems = exportItems.filter(i => i.materialId && i.quantity > 0);
    if (validItems.length === 0) { 
      alert(t('materials.valid_item_required') || 'Vui lòng nhập mặt hàng hợp lệ'); 
      return; 
    }
    
    for (const item of validItems) {
      const mat = materials.find(m => m.id === item.materialId);
      if (mat && item.quantity > mat.currentStock) {
        alert(`${mat.name} chỉ còn ${mat.currentStock} ${mat.unit}, không thể xuất ${item.quantity}`);
        return;
      }
    }
    
    setExportSaving(true);
    try {
      await materialsService.createTransaction({
        type: 'export', operator: 'Admin',
        referenceId: exportRef || undefined, notes: exportNotes || undefined,
        items: validItems
      });
      
      setExportItems([]); 
      setExportRef(''); 
      setExportNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert((t('materials.export_error') || 'Lỗi xuất kho') + ': ' + (err.message || err));
    } finally { 
      setExportSaving(false); 
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xuất kho nguyên liệu"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleExport} disabled={exportItems.length === 0 || exportSaving}>
            {exportSaving ? 'Đang xử lý...' : 'Xác nhận xuất kho'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
          <Input label="Mã tham chiếu (LSX)" placeholder="VD: LSX-20260423..." value={exportRef} onChange={(e: any) => setExportRef(e.target.value)} />
          <Input label="Ngày xuất" type="date" value={exportDate} onChange={(e: any) => setExportDate(e.target.value)} />
          <div className="col-span-2">
            <Input label="Ghi chú / Lý do xuất" placeholder="Xuất nguyên liệu cho lệnh sản xuất..." value={exportNotes} onChange={(e: any) => setExportNotes(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-900">Danh sách nguyên liệu xuất</h4>
            <Button size="sm" variant="secondary" className="gap-2" onClick={() => setExportItems(prev => [...prev, { materialId: '', materialName: '', quantity: 0 }])}>
              <Plus className="w-3 h-3" />
              <span>Thêm dòng</span>
            </Button>
          </div>
          {exportItems.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Chưa có mặt hàng nào. Nhấn "Thêm dòng".</p>}
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-100/50 text-gray-600 font-medium">
              <tr>
                <th className="p-3">Nguyên liệu</th>
                <th className="p-3">Tồn hiện tại</th>
                <th className="p-3">Số lượng xuất</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exportItems.map((item, idx) => {
                const mat = materials.find(m => m.id === item.materialId);
                return (
                  <tr key={idx}>
                    <td className="p-3">
                      <select
                        className="w-full p-2 bg-white border border-gray-200 rounded text-sm"
                        value={item.materialId}
                        onChange={(e) => {
                          const m = materials.find(m => m.id === e.target.value);
                          const updated = [...exportItems];
                          updated[idx] = { ...updated[idx], materialId: e.target.value, materialName: m?.name || '' };
                          setExportItems(updated);
                        }}
                      >
                        <option value="">Chọn nguyên liệu...</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code}) - Tồn: {m.currentStock} {m.unit}</option>)}
                      </select>
                    </td>
                    <td className="p-3 font-mono text-sm">
                      {mat ? <span className={mat.currentStock <= mat.minStock ? 'text-red-600 font-bold' : 'text-slate-700'}>{mat.currentStock} {mat.unit}</span> : <span className="text-slate-400">---</span>}
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        className={`w-28 p-2 bg-white border rounded text-sm ${mat && item.quantity > mat.currentStock ? 'border-red-500 text-red-600' : 'border-gray-200'}`}
                        value={item.quantity || ''} 
                        onChange={(e) => { const updated = [...exportItems]; updated[idx] = { ...updated[idx], quantity: Number(e.target.value) || 0 }; setExportItems(updated); }} 
                      />
                      {mat && item.quantity > mat.currentStock && (
                        <p className="text-[10px] text-red-500 mt-1">Vượt tồn kho!</p>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-gray-400 hover:text-red-600" onClick={() => setExportItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
