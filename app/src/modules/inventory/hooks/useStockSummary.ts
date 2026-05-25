/**
 * useStockSummary — Stock summary data, filtering, and sync logic
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { inventoryService } from '../services/inventory.service';
import { useSocket } from '../../../hooks/useSocket';

interface StockRow {
  supplier: string;
  subSku: string;
  productName: string;
  sku: string;
  specification: string;
  nhapKho: number;
  xuatKho: number;
  tonKho: number;
  tonThucTe: number;
  tonKhaDung: number;
  daGiuDon: number;
  loi: number;
  hong: number;
  minStock: number;
  createdAt: string;
  color: string;
  size: string;
  salesUnit: string;
  unitSize: string;
  pricePerUnit: number;
  costPriceLatest?: number;
  costPriceAverage?: number;
}

export type { StockRow };

export function useStockSummary() {
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced filters
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterSubSku, setFilterSubSku] = useState('');
  const [filterProductName, setFilterProductName] = useState('');
  const [filterSku, setFilterSku] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Excel sync state
  const [importing, setImporting] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    summary: { totalRows: number; matched: number; notFound: number; updated: number };
    errors: { row: number; message: string }[];
    details: { row: number; supplier: string; subSku: string; status: string; oldQty: number; newQty: number }[];
  } | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[] | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await inventoryService.getStockSummary()); }
    catch (err: any) { console.error('Error fetching stock summary:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useSocket({
    onInventoryUpdate: () => {
      fetchData();
    }
  });

  // File handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setFileBase64(base64);
      try {
        const XLSX = await import('xlsx');
        const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
        // Normalize Unicode keys (Google Sheets exports use NFD, our code uses NFC)
        const normalizeKey = (k: string) => k.normalize('NFC').trim();
        const rows = rawRows.map(row => {
          const normalized: Record<string, any> = {};
          for (const key of Object.keys(row)) normalized[normalizeKey(key)] = row[key];
          return normalized;
        });
        setPreviewRows(rows.slice(0, 50));
      } catch { setPreviewRows(null); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSync = async () => {
    if (!fileBase64) return;
    setImporting(true); setSyncResult(null);
    try { setSyncResult(await inventoryService.syncStock(fileBase64)); await fetchData(); }
    catch (err: any) { alert('Lỗi đồng bộ: ' + (err.message || err)); }
    finally { setImporting(false); }
  };

  const handleCancelImport = () => { setPreviewRows(null); setFileBase64(null); setSyncResult(null); };

  // Computed values
  const uniqueSuppliers = [...new Set(data.map(r => r.supplier).filter(Boolean))].sort();
  const uniqueProducts = [...new Set(data.map(r => r.productName).filter(Boolean))].sort();
  const uniqueSkus = [...new Set(data.map(r => r.sku).filter(Boolean))].sort();

  const activeFilterCount = [filterSupplier, filterSubSku, filterProductName, filterSku, filterSpec, filterDateFrom, filterDateTo].filter(Boolean).length;

  const filteredData = data.filter(r => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!(r.supplier || '').toLowerCase().includes(s) && !(r.subSku || '').toLowerCase().includes(s)
        && !(r.productName || '').toLowerCase().includes(s) && !(r.sku || '').toLowerCase().includes(s)) return false;
    }
    if (filterSupplier && r.supplier !== filterSupplier) return false;
    if (filterSubSku && !(r.subSku || '').toLowerCase().includes(filterSubSku.toLowerCase())) return false;
    if (filterProductName && r.productName !== filterProductName) return false;
    if (filterSku && r.sku !== filterSku) return false;
    if (filterSpec && !(r.specification || '').toLowerCase().includes(filterSpec.toLowerCase())) return false;
    if (filterDateFrom && r.createdAt < filterDateFrom) return false;
    if (filterDateTo && r.createdAt > filterDateTo + 'T23:59:59') return false;
    return true;
  });

  const totals = filteredData.reduce((acc, r) => ({
    nhapKho: acc.nhapKho + r.nhapKho, 
    xuatKho: acc.xuatKho + r.xuatKho, 
    tonKho: acc.tonKho + r.tonKho,
    tonThucTe: acc.tonThucTe + (r.tonThucTe || 0),
    tonKhaDung: acc.tonKhaDung + (r.tonKhaDung || 0),
    daGiuDon: acc.daGiuDon + (r.daGiuDon || 0),
    loi: acc.loi + (r.loi || 0),
    hong: acc.hong + (r.hong || 0),
  }), { 
    nhapKho: 0, xuatKho: 0, tonKho: 0, 
    tonThucTe: 0, tonKhaDung: 0, daGiuDon: 0, loi: 0, hong: 0 
  });

  const alertCount = data.filter(r => r.minStock > 0 && r.tonKhaDung <= r.minStock).length;

  const clearFilters = () => {
    setFilterSupplier(''); setFilterSubSku(''); setFilterProductName('');
    setFilterSku(''); setFilterSpec(''); setFilterDateFrom(''); setFilterDateTo(''); setSearchTerm('');
  };

  return {
    data, loading, filteredData, totals,
    searchTerm, setSearchTerm, showFilters, setShowFilters, activeFilterCount, clearFilters,
    filterSupplier, setFilterSupplier, filterSubSku, setFilterSubSku, filterProductName, setFilterProductName,
    filterSku, setFilterSku, filterSpec, setFilterSpec, filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo,
    uniqueSuppliers, uniqueProducts, uniqueSkus,
    importing, syncResult, previewRows, fileInputRef, alertCount,
    handleFileSelect, handleSync, handleCancelImport, fetchData
  };
}