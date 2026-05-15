/**
 * PricingImportModal — Import giá bán theo khách hàng (lần 2)
 * ─────────────────────────────────────────────────────────
 * Chỉ cập nhật pricingRules, KHÔNG tạo khách hàng mới.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  DollarSign, Download, Upload, CheckCircle2,
  AlertTriangle, XCircle, Loader2, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../../../components/ui/Modal';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { customerService } from '../services/customer.service';
import PricingImportDropzone from './PricingImportDropzone';
import PricingImportPreviewTable from './PricingImportPreviewTable';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Phase = 'upload' | 'preview' | 'importing' | 'result';

interface PreviewRow {
  rowNum: number;
  customerCode: string;
  customerName: string;
  sku: string;
  price: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  summary: { totalRows: number; success: number; failed: number; skipped: number };
  errors: { row: number; message: string }[];
}

const COLUMN_MAP: Record<string, string> = {
  'mã khách hàng': 'customerCode', 'ma khach hang': 'customerCode', 'customer code': 'customerCode',
  'tên khách hàng': 'customerName', 'ten khach hang': 'customerName', 'customer name': 'customerName',
  'sku': 'sku', 'mã sku': 'sku',
  'giá bán': 'price', 'gia ban': 'price', 'price': 'price', 'đơn giá': 'price', 'unit price': 'price',
};

const PricingImportModal: React.FC<Props> = ({ isOpen, onClose, onImported }) => {
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileBase64, setFileBase64] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase('upload');
    setFileName('');
    setPreviewRows([]);
    setFileBase64('');
    setResult(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const getVal = (row: Record<string, any>, canonical: string): string => {
    for (const [raw, mapped] of Object.entries(COLUMN_MAP)) {
      if (mapped === canonical && raw in row) return String(row[raw] || '').trim();
    }
    for (const key of Object.keys(row)) {
      const mapped = COLUMN_MAP[key.toLowerCase().trim()];
      if (mapped === canonical) return String(row[key] || '').trim();
    }
    return '';
  };

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (rows.length === 0) { alert('File trống'); return; }

        const base64Reader = new FileReader();
        base64Reader.onload = (ev) => setFileBase64((ev.target!.result as string).split(',')[1]);
        base64Reader.readAsDataURL(file);

        const preview: PreviewRow[] = rows.slice(0, 200).map((row, idx) => {
          const customerCode = getVal(row, 'customerCode');
          const customerName = getVal(row, 'customerName');
          const sku = getVal(row, 'sku');
          const price = getVal(row, 'price');

          let valid = true;
          let error = '';
          if (!customerCode) { valid = false; error = 'Thiếu mã KH'; }
          else if (!customerName) { valid = false; error = 'Thiếu tên KH'; }
          else if (!sku) { valid = false; error = 'Thiếu SKU'; }
          else {
            const p = Number(price.replace(/[,\s]/g, ''));
            if (isNaN(p) || p < 0) { valid = false; error = 'Giá không hợp lệ'; }
          }

          return { rowNum: idx + 2, customerCode, customerName, sku, price, valid, error };
        });

        setPreviewRows(preview);
        setPhase('preview');
      } catch { alert('File không hợp lệ'); }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleImport = async () => {
    if (!fileBase64) return;
    setPhase('importing');
    try {
      const data = await customerService.importPricing(fileBase64);
      setResult(data);
      setPhase('result');
      if (data.summary.success > 0) onImported();
    } catch (err: any) {
      alert('Import error: ' + (err.message || 'Unknown'));
      setPhase('preview');
    }
  };

  const validCount = previewRows.filter(r => r.valid).length;
  const invalidCount = previewRows.filter(r => !r.valid).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import giá bán theo khách hàng" size="lg">
      <div className="space-y-5">

        {/* ── UPLOAD ──────────────────────────────── */}
        {phase === 'upload' && (
          <PricingImportDropzone 
            onProcessFile={processFile} 
            onDownloadTemplate={() => customerService.downloadPricingTemplate()} 
          />
        )}

        {/* ── PREVIEW ─────────────────────────────── */}
        {phase === 'preview' && (
          <PricingImportPreviewTable 
            fileName={fileName} 
            previewRows={previewRows} 
            validCount={validCount} 
            invalidCount={invalidCount} 
            onReset={reset} 
            onImport={handleImport} 
          />
        )}

        {/* ── IMPORTING ──────────────────────────── */}
        {phase === 'importing' && (
          <div className="py-16 text-center">
            <Loader2 className="w-12 h-12 text-amber-500 mx-auto animate-spin mb-4" />
            <p className="font-bold text-slate-900">Đang import giá bán...</p>
            <p className="text-sm text-slate-500 mt-1">Đang đối chiếu mã KH và cập nhật bảng giá</p>
          </div>
        )}

        {/* ── RESULT ─────────────────────────────── */}
        {phase === 'result' && result && (
          <>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Tổng dòng', value: result.summary.totalRows, color: 'slate' },
                { label: 'Thành công', value: result.summary.success, color: 'green' },
                { label: 'Bỏ qua', value: result.summary.skipped, color: 'amber' },
                { label: 'Lỗi', value: result.summary.failed, color: 'red' },
              ].map((s, i) => (
                <Card key={i} className={`p-3 border-l-4 border-${s.color}-400`}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                  <p className="text-xl font-black text-slate-900">{s.value}</p>
                </Card>
              ))}
            </div>

            {result.summary.success > 0 && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-green-900">
                  Đã cập nhật {result.summary.success} giá bán thành công!
                </p>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-600 uppercase">Chi tiết lỗi ({result.errors.length})</p>
                <div className="max-h-[200px] overflow-auto rounded-lg bg-red-50/50 border border-red-100 p-3 space-y-1">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Badge variant="red" className="shrink-0">Dòng {err.row}</Badge>
                      <span className="text-red-700">{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={reset} className="gap-2 flex-1">
                <Upload className="w-4 h-4" /> Import thêm
              </Button>
              <Button onClick={handleClose} className="flex-1">Đóng</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PricingImportModal;
