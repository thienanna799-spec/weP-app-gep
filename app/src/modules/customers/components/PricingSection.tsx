/**
 * PricingSection — Flat table with per-SUB-SKU toggle
 * Columns: # | SUB-SKU | SKU | Tồn kho | Giá bán | Trạng thái | Người sửa
 */

import React, { useState, useEffect } from 'react';
import { Loader2, X, Check, Plus, Power } from 'lucide-react';
import { PricingRule } from '../types';
import { customerService } from '../services/customer.service';
import api from '../../../services/api';

interface SubSkuInfo {
  subSku: string; sku: string; productName: string;
  specification: string; supplier: string; tonKho: number;
}

import PricingTable, { FlatRow } from './PricingTable';

interface Props {
  rules: PricingRule[];
  customerId: string;
  onSaved: () => void;
}

const PricingSection: React.FC<Props> = ({ rules, customerId, onSaved }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [flatRows, setFlatRows] = useState<FlatRow[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [disabledSubSkus, setDisabledSubSkus] = useState<Set<string>>(new Set());

  // Add new SKU
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [addingSku, setAddingSku] = useState(false);

  // Load disabled SUB-SKU statuses
  useEffect(() => {
    if (!customerId) return;
    customerService.getSubSkuStatuses(customerId)
      .then(statuses => {
        const disabled = new Set<string>();
        for (const s of statuses) {
          if (!s.isActive) disabled.add(s.subSku);
        }
        setDisabledSubSkus(disabled);
      })
      .catch(() => {});
  }, [customerId]);

  // Build flat rows
  useEffect(() => {
    if (rules.length === 0) { setFlatRows([]); return; }
    const skus = [...new Set(rules.map(r => r.sku))].filter(Boolean);
    if (skus.length === 0) { setFlatRows([]); return; }

    setLoadingStock(true);
    api.get<SubSkuInfo[]>(`/inventory/by-sku?skus=${encodeURIComponent(skus.join(','))}`)
      .then(items => {
        const rows: FlatRow[] = [];
        for (const pr of rules) {
          const matching = items.filter(it => (it.sku || '').toUpperCase() === pr.sku.toUpperCase());
          if (matching.length > 0) {
            for (const m of matching) {
              rows.push({
                subSku: m.subSku, sku: pr.sku, tonKho: m.tonKho,
                price: pr.price, pricingId: pr.id,
                isSubSkuActive: !disabledSubSkus.has(m.subSku),
                updatedByName: pr.updatedByName, updatedAt: pr.updatedAt,
              });
            }
          } else {
            rows.push({
              subSku: '—', sku: pr.sku, tonKho: 0,
              price: pr.price, pricingId: pr.id,
              isSubSkuActive: true,
              updatedByName: pr.updatedByName, updatedAt: pr.updatedAt,
            });
          }
        }
        setFlatRows(rows);
      })
      .catch(() => {})
      .finally(() => setLoadingStock(false));
  }, [rules, disabledSubSkus]);

  const startEdit = (row: FlatRow) => { setEditingId(row.pricingId); setEditPrice(String(row.price)); };
  const cancelEdit = () => { setEditingId(null); setEditPrice(''); };

  const saveEdit = async (prId: string) => {
    const price = Number(editPrice.replace(/[,\s]/g, ''));
    if (isNaN(price) || price < 0) { alert('Giá không hợp lệ'); return; }
    setSaving(true);
    try { await customerService.updatePricingRule(prId, price); setEditingId(null); onSaved(); }
    catch (err: any) { alert('Lỗi: ' + (err.message || '')); }
    finally { setSaving(false); }
  };

  const handleToggleSubSku = async (subSku: string) => {
    if (subSku === '—') return;
    setToggling(subSku);
    try {
      await customerService.toggleSubSku(customerId, subSku);
      // Update local state immediately
      setDisabledSubSkus(prev => {
        const next = new Set(prev);
        if (next.has(subSku)) next.delete(subSku);
        else next.add(subSku);
        return next;
      });
    } catch (err: any) { alert('Lỗi: ' + (err.message || '')); }
    finally { setToggling(null); }
  };

  const handleAddSku = async () => {
    if (!newSku.trim()) { alert('Nhập mã SKU'); return; }
    const price = Number(newPrice.replace(/[,\s]/g, ''));
    if (isNaN(price) || price < 0) { alert('Giá không hợp lệ'); return; }
    setAddingSku(true);
    try {
      await customerService.addPricingRule(customerId, newSku.trim(), price);
      setNewSku(''); setNewPrice(''); setShowAddForm(false); onSaved();
    } catch (err: any) { alert('Lỗi: ' + (err.message || '')); }
    finally { setAddingSku(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent, prId: string) => {
    if (e.key === 'Enter') saveEdit(prId);
    if (e.key === 'Escape') cancelEdit();
  };

  const activeCount = flatRows.filter(r => r.isSubSkuActive).length;

  return (
    <div className="md:col-span-2 mt-2">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">💰 Bảng giá theo SKU</span>
        <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">{flatRows.length} SUB-SKU</span>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">🟢 {activeCount} đang bán</span>
        {loadingStock && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Click giá để sửa</span>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
            <Plus className="w-3 h-3" />Thêm SKU
          </button>
        </div>
      </div>

      {/* Add SKU form */}
      {showAddForm && (
        <div className="flex gap-2 items-end mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Mã SKU *</label>
            <input value={newSku} onChange={e => setNewSku(e.target.value)} placeholder="PLAIN--BLACK-L"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono" />
          </div>
          <div className="w-28">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Giá bán *</label>
            <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-right"
              onKeyDown={e => e.key === 'Enter' && handleAddSku()} />
          </div>
          <button onClick={handleAddSku} disabled={addingSku}
            className="h-9 px-4 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {addingSku ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Thêm'}
          </button>
          <button onClick={() => setShowAddForm(false)} className="h-9 px-2 text-slate-400 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <PricingTable
        flatRows={flatRows}
        loadingStock={loadingStock}
        editingId={editingId}
        editPrice={editPrice}
        setEditPrice={setEditPrice}
        saving={saving}
        toggling={toggling}
        startEdit={startEdit}
        saveEdit={saveEdit}
        cancelEdit={cancelEdit}
        handleKeyDown={handleKeyDown}
        handleToggleSubSku={handleToggleSubSku}
      />
    </div>
  );
};

export default PricingSection;
