import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Material } from '../types';
import { materialsService } from '../services/materials.service';

interface ImportItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen, onClose, materials, onSuccess
}) => {
  const { t } = useTranslation();
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [importSupplier, setImportSupplier] = useState('');
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [importRef, setImportRef] = useState('');
  const [importNotes, setImportNotes] = useState('');
  const [importSaving, setImportSaving] = useState(false);

  const handleImport = async () => {
    const validItems = importItems.filter(i => i.materialId && i.quantity > 0);
    if (validItems.length === 0) { 
      alert(t('materials.valid_item_required') || 'Vui lòng nhập mặt hàng hợp lệ'); 
      return; 
    }
    
    setImportSaving(true);
    try {
      await materialsService.createTransaction({
        type: 'import', operator: 'Admin',
        supplier: importSupplier || undefined, referenceId: importRef || undefined,
        notes: importNotes || undefined, items: validItems
      });
      
      setImportItems([]); 
      setImportSupplier(''); 
      setImportRef(''); 
      setImportNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert((t('materials.import_error') || 'Lỗi nhập kho') + ': ' + (err.message || err));
    } finally { 
      setImportSaving(false); 
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nhập kho nguyên liệu"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleImport} disabled={importItems.length === 0 || importSaving}>
            {importSaving ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <Input label="Nhà cung cấp" placeholder="Chọn hoặc nhập NCC" value={importSupplier} onChange={(e: any) => setImportSupplier(e.target.value)} />
          <Input label="Ngày nhập" type="date" value={importDate} onChange={(e: any) => setImportDate(e.target.value)} />
          <Input label="Số hóa đơn (nếu có)" placeholder="VD: INV-001" value={importRef} onChange={(e: any) => setImportRef(e.target.value)} />
          <Input label="Ghi chú" placeholder="Ghi chú thêm..." value={importNotes} onChange={(e: any) => setImportNotes(e.target.value)} />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-gray-900">Chi tiết mặt hàng</h4>
            <Button size="sm" variant="secondary" className="gap-2" onClick={() => setImportItems(prev => [...prev, { materialId: '', materialName: '', quantity: 0, unitPrice: 0 }])}>
              <Plus className="w-3 h-3" />
              <span>Thêm dòng</span>
            </Button>
          </div>
          {importItems.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Chưa có mặt hàng nào. Nhấn "Thêm dòng".</p>}
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="p-3">Nguyên liệu</th>
                <th className="p-3">Số lượng</th>
                <th className="p-3">Đơn giá</th>
                <th className="p-3 text-right">Thành tiền</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {importItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3">
                    <select 
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm"
                      value={item.materialId}
                      onChange={(e) => {
                        const mat = materials.find(m => m.id === e.target.value);
                        const updated = [...importItems];
                        updated[idx] = { ...updated[idx], materialId: e.target.value, materialName: mat?.name || '' };
                        setImportItems(updated);
                      }}
                    >
                      <option value="">Chọn nguyên liệu...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <input type="number" className="w-24 p-2 bg-white border border-gray-200 rounded text-sm" value={item.quantity || ''} onChange={(e) => { const updated = [...importItems]; updated[idx] = { ...updated[idx], quantity: Number(e.target.value) || 0 }; setImportItems(updated); }} />
                  </td>
                  <td className="p-3">
                    <input type="number" className="w-32 p-2 bg-white border border-gray-200 rounded text-sm" value={item.unitPrice || ''} onChange={(e) => { const updated = [...importItems]; updated[idx] = { ...updated[idx], unitPrice: Number(e.target.value) || 0 }; setImportItems(updated); }} />
                  </td>
                  <td className="p-3 text-right font-bold text-blue-600">₱{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-PH')}</td>
                  <td className="p-3 text-right">
                    <button className="text-gray-400 hover:text-red-600" onClick={() => setImportItems(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {importItems.length > 0 && (
            <div className="text-right text-sm font-bold text-slate-700 pt-2 border-t">
              Tổng: ₱{importItems.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0).toLocaleString('en-PH')}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImportModal;
