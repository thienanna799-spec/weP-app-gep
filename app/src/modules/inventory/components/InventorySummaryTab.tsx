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
import { InventoryTable } from './InventoryTable';
import { ExportOptionsModal } from './ExportOptionsModal';
import { exportModalToExcel, handleExportSelected } from '../utils/exportExcelUtils';
import { Download, Loader2 } from 'lucide-react';

interface Props {
  rolls?: ProductRoll[];
  onRollClick?: (roll: ProductRoll) => void;
  actionButtons?: React.ReactNode;
}

const InventorySummaryTab: React.FC<Props> = ({ rolls = [], onRollClick, actionButtons }) => {
  const h = useStockSummary();
  const [agingFilter, setAgingFilter] = useState(0);
  const [selectedRow, setSelectedRow] = useState<StockRow | null>(null);
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [exportingExcel, setExportingExcel] = useState(false);
  
  const [showImportForm, setShowImportForm] = useState(false);
  const [importQty, setImportQty] = useState('');
  const [importQuick, setImportQuick] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedBatch, setImportedBatch] = useState<any | null>(null);

  // Export Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

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

  const doExportModalToExcel = () => {
    exportModalToExcel(selectedRow, filteredRolls);
  };

  const doHandleExportSelected = () => {
    handleExportSelected(selectedSkus, exportStartDate, exportEndDate, setExportingExcel);
  };

  if (h.loading && h.data.length === 0) return <LoadingSpinner />;

  const handleDeleteProductGroup = async () => {
    if (!selectedRow) return;
    
    const confirmMessage = `Bạn có chắc chắn muốn xóa TOÀN BỘ cuộn vật lý thuộc sản phẩm này?\n\nXưởng: ${selectedRow.supplier || '—'}\nSub-SKU: ${selectedRow.subSku || '—'}\n\nHành động này không thể hoàn tác!`;
    
    if (window.confirm(confirmMessage)) {
      // Close modal and remove row from UI immediately (optimistic update)
      const deletedRow = selectedRow;
      setSelectedRow(null);

      try {
        const supplier = deletedRow.supplier || '';
        const subSku = deletedRow.subSku || '';
        await inventoryService.deleteRollGroup(supplier, subSku);
        h.fetchData(); // Refresh data in background
      } catch (error: any) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        h.fetchData(); // Refresh to restore correct state on error
      }
    }
  };

  const combinedActionButtons = (
    <>
      {selectedSkus.size > 0 && (
        <button 
          onClick={() => setShowExportModal(true)}
          disabled={exportingExcel}
          className={`flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm whitespace-nowrap transition-colors ${exportingExcel ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
        >
          {exportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {exportingExcel ? 'Đang xuất...' : `Tải Excel Tổng hợp (${selectedSkus.size})`}
        </button>
      )}
      {actionButtons}
    </>
  );

  const toggleAllSkus = () => {
    if (selectedSkus.size === h.filteredData.length) {
      setSelectedSkus(new Set());
    } else {
      const allKeys = h.filteredData.map((r: any) => `${r.subSku}|${r.supplier}`);
      setSelectedSkus(new Set(allKeys));
    }
  };

  const toggleSku = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedSkus);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedSkus(newSet);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">

      {/* Export Options Modal */}
      {showExportModal && (
        <ExportOptionsModal
          exportStartDate={exportStartDate}
          setExportStartDate={setExportStartDate}
          exportEndDate={exportEndDate}
          setExportEndDate={setExportEndDate}
          onClose={() => setShowExportModal(false)}
          onExport={doHandleExportSelected}
          exportingExcel={exportingExcel}
        />
      )}

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
        actionButtons={combinedActionButtons}
      />

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative flex flex-col flex-1 min-h-0 mt-4">
        <div className="flex-1 overflow-auto rounded-t-xl">
          <InventoryTable 
            filteredData={h.filteredData}
            dataLength={h.data.length}
            selectedSkus={selectedSkus}
            selectedRow={selectedRow}
            setSelectedRow={setSelectedRow}
            toggleAllSkus={toggleAllSkus}
            toggleSku={toggleSku}
            totals={h.totals}
          />
        </div>
      </div>

      {/* Selected Item Details */}
      {selectedRow && (
        <StockDetailModal 
          selectedRow={selectedRow}
          filteredRolls={filteredRolls}
          onRollClick={onRollClick}
          onExportExcel={doExportModalToExcel}
          onDeleteProductGroup={handleDeleteProductGroup}
          onClose={() => setSelectedRow(null)}
          agingFilter={agingFilter}
          setAgingFilter={setAgingFilter}
          importQty={importQty}
          setImportQty={setImportQty}
          importQuick={importQuick}
          setImportQuick={setImportQuick}
          importing={importing}
          onImportGoods={handleImportGoods}
          importedBatch={importedBatch}
          showImportForm={showImportForm}
          setShowImportForm={setShowImportForm}
        />
      )}

    </div>
  );
};

export default InventorySummaryTab;