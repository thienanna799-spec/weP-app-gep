/**
 * InventorySummaryTab — Stock summary with sync + filters
 * ───────────────────────────────────────────────────────
 * Logic in useStockSummary hook, panels in StockSyncPanel + StockFilterBar.
 * Detail modal in StockDetailModal, import form in QuickImportForm.
 */

import React, { useState, useEffect, useMemo } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useStockSummary, StockRow } from '../hooks/useStockSummary';
import StockSyncPanel from './StockSyncPanel';
import StockFilterBar from './StockFilterBar';
import StockDetailModal from './StockDetailModal';
import { inventoryService } from '../services/inventory.service';
import { ProductRoll } from '../types';
import { utils, writeFile } from 'xlsx';

interface Props {
  rolls?: ProductRoll[];
  onRollClick?: (roll: ProductRoll) => void;
  actionButtons?: React.ReactNode;
}

const InventorySummaryTab: React.FC<Props> = ({ rolls = [], onRollClick, actionButtons }) => {
  const h = useStockSummary();
  const [agingFilter, setAgingFilter] = useState(0);
  const [selectedRow, setSelectedRow] = useState<StockRow | null>(null);
  
  // Import Goods states
  const [showImportForm, setShowImportForm] = useState(false);
  const [importQty, setImportQty] = useState('');
  const [importQuick, setImportQuick] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedBatch, setImportedBatch] = useState<any | null>(null);

  const handleImportGoods = async () => {
    if (!selectedRow) return;
    const qty = parseInt(importQty, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Vui lòng nhập số lượng lớn hơn 0');
      return;
    }
    
    setImporting(true);
    try {
      const batch = await inventoryService.createImportBatch({
        productName: selectedRow.productName,
        sku: selectedRow.sku || undefined,
        subSku: selectedRow.subSku || undefined,
        supplier: selectedRow.supplier || undefined,
        specification: selectedRow.specification || undefined,
        quantity: qty,
        quickImport: importQuick
      });
      setImportedBatch(batch);
      setImportQty('');
      alert('Nhập hàng thành công! Vui lòng in mã QR.');
      h.fetchData(); // Trigger data refresh
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || err));
    } finally {
      setImporting(false);
    }
  };

  // Sync selectedRow when underlying data updates
  useEffect(() => {
    if (selectedRow) {
      const updatedRow = h.filteredData.find((r: any) => 
        r.subSku === selectedRow.subSku && 
        r.supplier === selectedRow.supplier &&
        r.productName === selectedRow.productName
      );
      if (updatedRow) {
        setSelectedRow(updatedRow as any);
      }
    }
  }, [h.filteredData]);

  // Reset import states when modal is closed or row changes
  useEffect(() => {
    setShowImportForm(false);
    setImportedBatch(null);
    setImportQty('');
    setImportQuick(false);
  }, [selectedRow]);

  const filteredRolls = useMemo(() => {
    if (!selectedRow) return [];
    let list = rolls.filter(r => r.subSku === selectedRow.subSku && (r.supplier || '') === (selectedRow.supplier || ''));
    
    if (agingFilter > 0) {
      const now = Date.now();
      list = list.filter(r => {
        // Only apply aging to physical stock that hasn't been exported
        if (r.status !== 'trong_kho' && r.status !== 'da_giu_cho_don') return false;
        
        // Use productionDate if available, fallback to createdAt
        const dateStr = r.productionDate || (r as any).createdAt;
        if (!dateStr) return false;
        
        const rollDate = new Date(dateStr).getTime();
        const daysInStock = (now - rollDate) / (1000 * 60 * 60 * 24);
        return daysInStock > agingFilter;
      });
    }
    return list;
  }, [selectedRow, rolls, agingFilter]);

  const exportModalToExcel = () => {
    if (!selectedRow || filteredRolls.length === 0) return;

    const dataToExport = filteredRolls.map((roll, index) => ({
      'STT': index + 1,
      'Sản phẩm': roll.productName || selectedRow.productName,
      'Quy cách': roll.specification || selectedRow.specification,
      'Mã cuộn': roll.code,
      'Mã QR': roll.qrCode,
      'Kho': roll.positionWarehouse || '',
      'Khu vực': roll.positionArea || '',
      'Vị trí': roll.positionSlot || '',
      'Chiều dài (m)': roll.length,
      'Cân nặng (kg)': roll.weight,
      'Ngày sản xuất': roll.productionDate ? new Date(roll.productionDate).toLocaleDateString('vi-VN') : '',
      'Trạng thái': roll.status,
    }));

    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Danh_sach_cuon');
    
    // Auto-size columns slightly
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }
    ];

    const safeSku = (selectedRow.subSku || 'Unknown').replace(/[^a-zA-Z0-9-]/g, '_');
    writeFile(workbook, `ChiTietCuon_${safeSku}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (h.loading && h.data.length === 0) return <LoadingSpinner />;

  const handleDeleteProductGroup = async () => {
    if (!selectedRow) return;
    
    const confirmMessage = `Bạn có chắc chắn muốn xóa TOÀN BỘ cuộn vật lý thuộc sản phẩm này?\n\nXưởng: ${selectedRow.supplier || '—'}\nSub-SKU: ${selectedRow.subSku || '—'}\n\nHành động này không thể hoàn tác!`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const supplier = selectedRow.supplier || '';
        const subSku = selectedRow.subSku || '';
        await inventoryService.deleteRollGroup(supplier, subSku);
        alert('Xóa sản phẩm thành công!');
        h.fetchData();
        setSelectedRow(null);
      } catch (error: any) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Excel Sync Panel */}
      <StockSyncPanel syncResult={h.syncResult} previewRows={h.previewRows} importing={h.importing} onSync={h.handleSync} onCancel={h.handleCancelImport} />

      {/* Search + Filter Bar */}
      <StockFilterBar
        searchTerm={h.searchTerm} setSearchTerm={h.setSearchTerm}
        showFilters={h.showFilters} setShowFilters={h.setShowFilters}
        activeFilterCount={h.activeFilterCount} clearFilters={h.clearFilters}
        filterSupplier={h.filterSupplier} setFilterSupplier={h.setFilterSupplier}
        filterSubSku={h.filterSubSku} setFilterSubSku={h.setFilterSubSku}
        filterProductName={h.filterProductName} setFilterProductName={h.setFilterProductName}
        filterSku={h.filterSku} setFilterSku={h.setFilterSku}
        filterSpec={h.filterSpec} setFilterSpec={h.setFilterSpec}
        filterDateFrom={h.filterDateFrom} setFilterDateFrom={h.setFilterDateFrom}
        filterDateTo={h.filterDateTo} setFilterDateTo={h.setFilterDateTo}
        uniqueSuppliers={h.uniqueSuppliers} uniqueProducts={h.uniqueProducts} uniqueSkus={h.uniqueSkus}
        actionButtons={actionButtons}
      />

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          {h.filteredData.length === 0 ? (
            <div className="px-4 py-12 text-center text-slate-400 text-sm italic">
              {h.data.length === 0 ? 'Chưa có dữ liệu tồn kho. Hãy nhập hàng trước hoặc import Excel.' : 'Không tìm thấy kết quả'}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr className="text-[10px] uppercase tracking-wi{
  "event_id": "2026-05-14-001",
  "timestamp": "2026-05-14T03:15:21.139Z",
  "workspace_id": "gep-erp-master",
  "git_commit": "no-git",
  "type": "BUG_FIX",
  "severity": "HIGH",
  "title": "Fix Inventory Page Crash - Missing BarChart3 Import",
  "why": "The inventory page crashed to a white screen because the BarChart3 icon was removed from lucide-react imports, but it was still being used in the table header of the summary view.",
  "root_cause": "Overzealous cleanup of imports when removing the 'Tổng hợp tồn kho' header.",
  "solution": "Re-added the BarChart3 import to InventorySummaryTab.tsx to resolve the compilation error.",
  "blast_radius": [
    "inventory-stock-calculation",
    "product-roll-status",
    "order-reservation",
    "qr-scanner"
  ],
  "affected_files": [
    "app/src/modules/inventory/components/InventorySummaryTab.tsx"
  ],
  "affected_nodes": [],
  "affected_domains": [
    "inventory"
  ],
  "caused_by": [],
  "related_incidents": [],
  "prevention": "Double check all usages of an import within the entire file before removing it.",
  "rollback_strategy": "Git revert the commit, or remove the BarChart3 usage from the table header.",
  "governance_approval": true,
  "data_loss": false,
  "related_adr": []
}          