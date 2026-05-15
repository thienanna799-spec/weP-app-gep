/**
 * CustomerForm – Create/Edit customer modal
 * Compact layout matching OrderCreateModal style
 */
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, Plus, X, Search } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { Customer, BankAccount } from '../types';
import { customerService, bankAccountService } from '../services/customer.service';
import { PROVINCES } from '../constants';
import CustomerCRMFields from './CustomerCRMFields';
import PricingSection from './PricingSection';
import CustomerBasicInfo from './CustomerBasicInfo';
import PendingPricingList, { PendingPricing } from './PendingPricingList';
import api from '../../../services/api';

interface Props { isOpen: boolean; onClose: () => void; customer: Customer | null; onSaved: () => void; }

const emptyForm = (): Partial<Customer> => ({
  name: '', phone: '', email: '', address: '', province: '', district: '',
  customerType: 'ca_nhan', company: '', taxCode: '', contactPerson: '',
  preferredPayment: 'cod', bankAccountNumber: '', bankName: '', bankAccountHolder: '',
  telegramChatId: '', notes: '', recipientName: '', groupName: '', groupChatLink: '',
  operatingPlatform: '', customerCharacteristics: '', gipCode: '', product: '',
  operationalStatus: 'active', boss: '', tag: '', googleMapsLink: '',
  creditLimit: 0, creditDays: 30,
});

const CustomerForm: React.FC<Props> = ({ isOpen, onClose, customer, onSaved }) => {
  const [formData, setFormData] = useState<Partial<Customer>>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState('');
  const phoneCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Pending pricing for new customer
  const [pendingPricing, setPendingPricing] = useState<PendingPricing[]>([]);
  const [newSkuInput, setNewSkuInput] = useState('');
  const [newPriceInput, setNewPriceInput] = useState('');
  const [searchingSku, setSearchingSku] = useState(false);
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(customer ? { ...customer } : emptyForm());
      setPhoneWarning('');
      setPendingPricing([]); setShowAddPricing(false);
      setNewSkuInput(''); setNewPriceInput('');
      setShowDeleteConfirm(false); setDeleteReason('');
      bankAccountService.getAll().then(setBankAccounts).catch(() => {});
    }
  }, [isOpen, customer]);

  const setField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (key === 'phone' && value.length >= 9) {
      if (phoneCheckRef.current) clearTimeout(phoneCheckRef.current);
      phoneCheckRef.current = setTimeout(async () => {
        try {
          const r = await customerService.checkPhone(value, customer?.id);
          setPhoneWarning(r.exists && r.customer ? `SĐT đã tồn tại: ${r.customer.name} (${r.customer.code})` : '');
        } catch {}
      }, 500);
    }
  };

  const handleAddPendingSku = async () => {
    const sku = newSkuInput.trim().toUpperCase();
    if (!sku) { alert('Nhập mã SKU'); return; }
    const price = Number(newPriceInput.replace(/[,\s]/g, ''));
    if (isNaN(price) || price < 0) { alert('Giá không hợp lệ'); return; }
    if (pendingPricing.some(p => p.sku === sku)) { alert('SKU đã có trong danh sách'); return; }
    setSearchingSku(true);
    try {
      const items: { subSku: string; sku: string }[] = await api.get(`/inventory/by-sku?skus=${encodeURIComponent(sku)}`);
      const subSkus = items.map(i => i.subSku).filter(Boolean);
      setPendingPricing(prev => [...prev, { sku, price, subSkus }]);
      setNewSkuInput(''); setNewPriceInput('');
    } catch { setPendingPricing(prev => [...prev, { sku, price, subSkus: [] }]); setNewSkuInput(''); setNewPriceInput(''); }
    finally { setSearchingSku(false); }
  };

  const removePendingSku = (idx: number) => setPendingPricing(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!formData.name?.trim()) { alert('Vui lòng nhập tên khách hàng'); return; }
    if (!formData.phone?.trim()) { alert('Vui lòng nhập số điện thoại'); return; }
    if (!formData.address?.trim()) { alert('Vui lòng nhập địa chỉ'); return; }
    if (phoneWarning) { alert('Số điện thoại đã tồn tại'); return; }
    setSaving(true);
    try {
      if (customer) {
        await customerService.update(customer.id, formData);
      } else {
        const created = await customerService.create(formData);
        if (pendingPricing.length > 0 && created?.id) {
          for (const pp of pendingPricing) {
            try { await customerService.addPricingRule(created.id, pp.sku, pp.price); } catch {}
          }
        }
      }
      onClose(); onSaved();
    } catch (e: any) { alert('Lỗi: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!customer?.id) return;
    if (!deleteReason.trim()) {
      alert('Vui lòng nhập lý do xóa!');
      return;
    }
    try {
      setDeleting(true);
      await customerService.delete(customer.id, deleteReason);
      onClose();
      onSaved();
    } catch (e: any) {
      alert('Lỗi khi xóa: ' + (e.message || ''));
    } finally {
      setDeleting(false);
    }
  };

  const isEdit = !!customer;
  const sel = "w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Sửa: ${customer.name}` : 'Thêm khách hàng mới'} size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex-1">
            {isEdit && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <Input 
                    value={deleteReason} 
                    onChange={e => setDeleteReason(e.target.value)} 
                    placeholder="Lý do xóa..." 
                    className="h-9 w-48 text-sm border-red-200 focus:border-red-500 focus:ring-red-500/20"
                    autoFocus
                  />
                  <Button onClick={handleDelete} disabled={deleting || !deleteReason.trim()} className="bg-red-600 hover:bg-red-700 text-white h-9 px-3 border-transparent">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác nhận xóa'}
                  </Button>
                  <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteReason(''); }} className="h-9 px-2 bg-slate-50 border-transparent hover:bg-slate-100 shadow-none">
                    Hủy
                  </Button>
                </div>
              ) : (
                <button onClick={() => setShowDeleteConfirm(true)} className="text-sm font-medium text-slate-400 hover:text-red-600 flex items-center gap-1.5 transition-colors px-2 py-1.5 rounded hover:bg-red-50">
                  <AlertTriangle className="w-4 h-4" /> Xóa khách hàng
                </button>
              )
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={onClose}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 shadow-md">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      }>
      <div className="space-y-3">
        {/* Row 1: Customer Info + Config side-by-side */}
        <CustomerBasicInfo formData={formData} setField={setField} phoneWarning={phoneWarning} bankAccounts={bankAccounts} />

        {/* Pricing — Edit mode: full PricingSection */}
        {isEdit&&customer&&<PricingSection rules={customer.pricingRules||[]} customerId={customer.id} onSaved={onSaved}/>}

        {/* Pricing — Create mode: add SKU + price */}
        {!isEdit && (
          <PendingPricingList
            pendingPricing={pendingPricing}
            showAddPricing={showAddPricing}
            setShowAddPricing={setShowAddPricing}
            newSkuInput={newSkuInput}
            setNewSkuInput={setNewSkuInput}
            newPriceInput={newPriceInput}
            setNewPriceInput={setNewPriceInput}
            handleAddPendingSku={handleAddPendingSku}
            searchingSku={searchingSku}
            removePendingSku={removePendingSku}
          />
        )}
      </div>
    </Modal>
  );
};

export default CustomerForm;
