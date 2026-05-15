/**
 * ManualImportTab — Orchestrator for manual product import
 * ────────────────────────────────────────────────────────
 * Logic in useManualImport hook, UI in BatchCreateForm + BatchDetailPanel.
 */

import React from 'react';
import { PackagePlus, Boxes, Plus, Clock, CheckCircle2, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { formatDate } from '../../../utils/format';
import { useManualImport } from '../hooks/useManualImport';
import ExcelImportPanel from './ExcelImportPanel';
import BatchCreateForm from './BatchCreateForm';
import BatchDetailPanel from './BatchDetailPanel';
import { useState, useMemo } from 'react';

const ManualImportTab: React.FC = () => {
  const { t } = useTranslation();
  const h = useManualImport();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBatches = useMemo(() => {
    return h.batches.filter(b => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (b.sku || '').toLowerCase().includes(s)
        || (b.productName || '').toLowerCase().includes(s)
        || (b.supplier || '').toLowerCase().includes(s)
        || (b.subSku || '').toLowerCase().includes(s)
        || (b.color || '').toLowerCase().includes(s);
    });
  }, [h.batches, searchTerm]);

  if (h.loading && !h.batches.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <PackagePlus className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('inventory.manual_import.title', 'Khai báo sản phẩm')}</h3>
            <p className="text-xs text-slate-500">{t('inventory.manual_import.subtitle', 'Khai báo sản phẩm từ nhà cung cấp, hàng không qua sản xuất')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={h.fetchBatches} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </Button>
          <Button onClick={() => { h.setShowForm(true); h.setActiveBatch(null); }} className="gap-1.5 bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-200">
            <Plus className="w-4 h-4" /> Tạo lô nhập
          </Button>
        </div>
      </div>

      <ExcelImportPanel onImportComplete={() => { h.fetchBatches(); h.setActiveBatch(null); }} />

      {/* Create Form */}
      {h.showForm && (
        <BatchCreateForm
          sku={h.sku} setSku={h.setSku}
          productName={h.productName} setProductName={h.setProductName}
          subSku={h.subSku} setSubSku={h.setSubSku}
          specification={h.specification} setSpecification={h.setSpecification}
          color={h.color} setColor={h.setColor}
          otherSpecs={h.otherSpecs} setOtherSpecs={h.setOtherSpecs}
          costPrice={h.costPrice} setCostPrice={h.setCostPrice}
          supplier={h.supplier} setSupplier={h.setSupplier}
          note={h.note} setNote={h.setNote}
          quickImport={h.quickImport} setQuickImport={h.setQuickImport}
          quantity={h.quantity} setQuantity={h.setQuantity}
          creating={h.creating}
          onSubmit={h.handleCreateBatch}
          onCancel={() => { h.setShowForm(false); h.resetForm(); }}
        />
      )}

      {/* Search */}
      <Card className="p-4 bg-white shadow-sm mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('inventory.product_catalog.search_placeholder', 'Tìm kiếm theo mã SKU, tên sản phẩm, xưởng, sub-sku, màu sắc...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          />
        </div>
      </Card>

      {/* Batch History Table */}
      <Card className="overflow-hidden border-t-0 shadow-sm">
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
          {filteredBatches.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm italic">Chưa có lô nhập nào</div>
          ) : (
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50 sticky left-0 z-20">SKU</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50">XƯỞNG</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50">TÊN SP</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50">SUB-SKU</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50">MÀU SẮC</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50">QUY CÁCH</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50">THÔNG SỐ KHÁC</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50 text-right">GIÁ VỐN</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50 text-center">SL</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50">NGÀY</th>
                  <th className="px-3 py-2.5 whitespace-nowrap bg-slate-50 text-center">TT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(batch => {
                  const s = h.getBatchStatusSummary(batch);
                  const isActive = h.activeBatch?.id === batch.id;
                  const allDone = s.pending === 0;
                  return (
                    <tr key={batch.id} onClick={() => h.fetchBatchDetail(batch.id)}
                      className={`cursor-pointer transition-all hover:bg-blue-50/50 ${isActive ? 'bg-violet-50 ring-1 ring-inset ring-violet-300' : ''}`}>
                      <td className="px-3 py-2.5 font-mono text-slate-700 font-medium whitespace-nowrap bg-white sticky left-0 border-r border-slate-100">{batch.sku || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{batch.supplier || '—'}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[180px] truncate">{batch.productName}</td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">{batch.subSku || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{batch.color || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{batch.specification || '—'}</td>
                      <td className="px-3 py-2.5 text-slate-500 max-w-[150px] truncate">{batch.otherSpecs || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">{batch.costPrice != null ? batch.costPrice.toLocaleString('vi-VN') : '—'}</td>
                      <td className="px-3 py-2.5 text-center"><span className="font-bold text-slate-900">{batch.quantity}</span></td>
     