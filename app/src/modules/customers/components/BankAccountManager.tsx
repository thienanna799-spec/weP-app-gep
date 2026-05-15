/**
 * BankAccountManager – Manage company bank accounts
 * ─────────────────────────────────────────────────────────
 * Inline section for the Customers page.
 * Allows adding/editing/deleting company bank accounts
 * so they can be quickly selected when creating orders.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Edit2, X, Check, Loader2, Building2 } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { bankAccountService } from '../services/customer.service';
import { BankAccount } from '../types';
import { useTranslation } from 'react-i18next';

const BankAccountManager: React.FC = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountHolder: '', branch: '', isDefault: false });

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await bankAccountService.getAll();
      setAccounts(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadAccounts(); }, []);

  const resetForm = () => {
    setForm({ bankName: '', accountNumber: '', accountHolder: '', branch: '', isDefault: false });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (acc: BankAccount) => {
    setForm({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolder: acc.accountHolder, branch: acc.branch || '', isDefault: acc.isDefault });
    setEditingId(acc.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolder.trim()) {
      alert(t('common.required'));
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await bankAccountService.update(editingId, form);
      } else {
        await bankAccountService.create(form);
      }
      resetForm();
      loadAccounts();
    } catch (e: any) {
      alert(t('common.error') + ': ' + (e.message || ''));
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm') + '?')) return;
    try {
      await bankAccountService.delete(id);
      loadAccounts();
    } catch (e: any) {
      alert(t('common.error') + ': ' + (e.message || ''));
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t('finance.bank_accounts')}</h3>
            <p className="text-[10px] text-slate-400">{t('customers.bank_desc')}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1 text-xs bg-blue-600 shadow-sm">
          <Plus className="w-3 h-3" /> {t('common.add')}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in">
          <p className="text-xs font-bold text-blue-700">{editingId ? t('common.edit') : t('common.add')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Tên ngân hàng *</label>
              <Input value={form.bankName} onChange={(e: any) => setForm(f => ({...f, bankName: e.target.value}))} placeholder="VD: Vietcombank" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Số tài khoản *</label>
              <Input value={form.accountNumber} onChange={(e: any) => setForm(f => ({...f, accountNumber: e.target.value}))} placeholder="VD: 0123456789" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Tên chủ tài khoản *</label>
              <Input value={form.accountHolder} onChange={(e: any) => setForm(f => ({...f, accountHolder: e.target.value}))} placeholder="VD: NGUYEN VAN A" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Chi nhánh</label>
              <Input value={form.branch} onChange={(e: any) => setForm(f => ({...f, branch: e.target.value}))} placeholder="VD: Hà Nội" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({...f, isDefault: e.target.checked}))}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs text-slate-600 font-medium">Đặt làm mặc định</span>
            </label>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={resetForm} className="text-xs">
                <X className="w-3 h-3 mr-1" /> {t('common.cancel')}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs bg-blue-600">
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                {editingId ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account list */}
      {loading ? (
        <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" /></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs italic">
          {t('common.no_data')}
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${acc.isDefault ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${acc.isDefault ? 'bg-blue-100' : 'bg-slate-50'}`}>
                  🏦
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{acc.bankName}</p>
                    {acc.isDefault && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5" /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{acc.accountNumber} · {acc.accountHolder}</p>
                  {acc.branch && <p className="text-[10px] text-slate-400">CN: {acc.branch}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(acc)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankAccountManager;
