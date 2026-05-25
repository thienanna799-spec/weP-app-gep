/**
 * useManualImport — Business logic for manual import tab
 * ──────────────────────────────────────────────────────
 * Manages batch list, form state, creation, and scanning.
 */

import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventory.service';
import { ImportBatch } from '../types';

export function useManualImport() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeBatch, setActiveBatch] = useState<ImportBatch | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [subSku, setSubSku] = useState('');
  const [specification, setSpecification] = useState('');
  const [color, setColor] = useState('');
  const [otherSpecs, setOtherSpecs] = useState('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const [quickImport, setQuickImport] = useState(false);

  const [quantity, setQuantity] = useState<string>('');

  // Data fetching
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getImportBatches();
      setBatches(data);
    } catch (err: any) {
      console.error('Error fetching import batches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatchDetail = useCallback(async (id: string) => {
    try {
      const data = await inventoryService.getImportBatch(id);
      setActiveBatch(data);
    } catch (err: any) {
      console.error('Error fetching batch detail:', err);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const resetForm = () => {
    setSku(''); setProductName(''); setSubSku(''); setSpecification('');
    setColor(''); setOtherSpecs(''); setCostPrice('');
    setSupplier(''); setNote(''); setQuickImport(false);
    setQuantity('');
  };

  const handleCreateBatch = async () => {
    if (!productName.trim()) { alert('Vui lòng nhập tên sản phẩm'); return; }
    setCreating(true);
    try {
      const parsedQty = quantity ? parseInt(quantity, 10) : 0;
      const finalQty = isNaN(parsedQty) || parsedQty < 0 ? 0 : parsedQty;
      
      const batch = await inventoryService.createImportBatch({
        productName: productName.trim(),
        sku: sku.trim() || undefined,
        subSku: subSku.trim() || undefined,
        specification: specification.trim() || undefined,
        color: color.trim() || undefined,
        otherSpecs: otherSpecs.trim() || undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        quantity: finalQty,
        supplier: supplier.trim() || undefined,
        note: note.trim() || undefined,
        quickImport,
      });
      alert('Đã tạo lô hàng thành công! Đơn hàng đã được chuyển sang mục "Sản xuất ngoài" để in tem và nhập kho.');
      setActiveBatch(null);
      setShowForm(false);
      resetForm();
      fetchBatches();
    } catch (err: any) {
      alert('Lỗi tạo lô: ' + (err.message || err));
    } finally {
      setCreating(false);
    }
  };

  const handleScanManual = async (code: string, quality: 'new' | 'loi' | 'hong') => {
    try {
      await inventoryService.scanManualRoll(code, quality);
      if (activeBatch) fetchBatchDetail(activeBatch.id);
      fetchBatches();
      return true;
    } catch {
      return false;
    }
  };

  const handleMarkBatchDone = async (batchId: string) => {
    try {
      await inventoryService.markBatchDone(batchId);
      if (activeBatch?.id === batchId) setActiveBatch(null);
      fetchBatches();
      return true;
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || err));
      return false;
    }
  };

  const getBatchStatusSummary = (batch: ImportBatch) => {
    const sc = batch.statusCounts || {};
    const inStock = (sc['trong_kho'] || 0) + (sc['da_giu_cho_don'] || 0) + (sc['da_xuat_kho'] || 0);
    const defective = sc['loi_hong'] || 0;
    const pending = sc['cho_nhap_kho'] || 0;
    const total = inStock + defective + pending;
    return { inStock, defective, pending, total };
  };

  return {
    batches, loading, creating, activeBatch, setActiveBatch, showForm, setShowForm,
    sku, setSku, productName, setProductName, subSku, setSubSku, specification, setSpecification,
    color, setColor, otherSpecs, setOtherSpecs, costPrice, setCostPrice, supplier, setSupplier,
    note, setNote, quickImport, setQuickImport, quantity, setQuantity,
    fetchBatches, fetchBatchDetail, resetForm, handleCreateBatch, handleScanManual, handleMarkBatchDone,
    getBatchStatusSummary
  };
}