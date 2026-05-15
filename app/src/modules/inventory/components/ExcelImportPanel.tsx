/**
 * ExcelImportPanel — Multi-step Excel import flow
 * ────────────────────────────────────────────────
 * Step 1: Upload → Step 2: Preview → Step 3: Result
 * Preview table in ExcelPreviewTable, result in ExcelImportResult.
 */

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet, Download, Upload, XCircle, Zap, FileUp, Loader2,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { inventoryService } from '../services/inventory.service';
import ExcelPreviewTable from './ExcelPreviewTable';
import ExcelImportResult from './ExcelImportResult';

interface ExcelRow { [key: string]: any; }

interface ImportResult {
  batchIds: string[];
  summary: { totalRows: number; success: number; failed: number; totalRollsCreated: number };
  errors: { row: number; message: string }[];
}

interface ExcelImportPanelProps { onImportComplete: () => void; }

const ExcelImportPanel: React.FC<ExcelImportPanelProps> = ({ onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [previewRows, setPreviewRows] = useState<ExcelRow[]>([]);
  const [quickImport, setQuickImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState('');

  const handleDownloadTemplate = async () => {
    try { await inventoryService.downloadImportTemplate(); }
    catch (err: any) { alert('Lỗi tải template: ' + (err.message || err)); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) { setParseError('Chỉ hỗ trợ file .xlsx hoặc .xls'); return; }
    if (file.size > 5 * 1024 * 1024) { setParseError('File quá lớn (tối đa 5MB)'); return; }
    setFileName(file.name); setParseError('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setFileBase64(base64);
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: ExcelRow[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      if (rows.length === 0) { setParseError('File Excel trống — không có dữ liệu'); return; }
      if (!('TÊN SP' in rows[0]) && !('product_name' in rows[0])) { setParseError('Thiếu cột bắt buộc: TÊN SP. Vui lòng tải template mẫu.'); return; }
      setPreviewRows(rows.slice(0, 100));
      setStep('preview');
    } catch { setParseError('Không thể đọc file. Vui lòng kiểm tra định dạng.'); }
  };

  const handleImport = async () => {
    setImporting(true);
    try { setResult(await inventoryService.importExcel(fileBase64, quickImport)); setStep('result'); onImportComplete(); }
    catch (err: any) { alert('Lỗi import: ' + (err.message || err)); }
    finally { setImporting(false); }
  };

  const handleReset = () => {
    setStep('upload'); setFileName(''); setFileBase64(''); setPreviewRows([]); setResult(null); setParseError(''); setQuickImport(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatNoteValue = (val: any): string => {
    if (!val && val !== 0) return '';
    const str = String(val).trim();
    const num = Number(str);
    if (!isNaN(num) && num >= 40000 && num <= 60000 && Number.isInteger(num)) {
      return new Date((num - 25569) * 86400 * 1000).toLocaleDateString('vi-VN');
    }
    return str;
  };

  const totalItems = previewRows.reduce((sum, r) => sum + (Number(r['SỐ LƯỢNG'] || r.quantity || 0) || 0), 0);

  return (
    <Card className="overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Import từ Excel</h4>
            <p className="text-[10px] text-slate-500">Upload file .xlsx để nhập hàng loạt</p>
          </div>
        </div>
        <Button variant="secondary" onClick={handleDownloadTemplate} className="gap-1.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-100">
          <Download className="w-3.5 h-3.5" /> Tải template
        </Button>
      </div>

      <div className="p-5">
        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="w-10 h-10 text-slate-300 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
              <p className="text-sm font-bold text-slate-600 group-hover:text-emerald-700">Kéo thả hoặc nhấn để chọn file</p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ: .xlsx, .xls • Tối đa 1,000 dòng</p>
              {fileName && <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-600 font-bold"><FileSpreadsheet className="w-4 h-4" />{fileName}</div>}
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
            {parseError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{parseError}</p>
              </div>
            )}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 space-y-1">
              <p className="font-bold">📋 Cấu trúc file mẫu (MỚI):</p>
              <div className="flex flex-wrap gap-1 mt-2 font-mono text-[10px]">
                {['STT', 'SKU', 'XƯỞNG'].map(c => <span key={c} className="bg-blue-100 px-2 py-1 rounded">{c}</span>)}
                <span className="bg-blue-100 px-2 py-1 rounded font-bold text-red-600">TÊN SP *</span>
                {['SUB-SKU', 'MÀU SẮC', 'QUY CÁCH', 'THÔNG SỐ KHÁC'].map(c => <span key={c} className="bg-blue-100 px-2 py-1 rounded">{c}</span>)}
                <span className="bg-orange-100 px-2 py-1 rounded font-bold text-orange-700">SỐ LƯỢNG</span>
                {['GIÁ VỐN', 'Ghi chú', 'NOTE'].map(c => <span key={c} className="bg-blue-100 px-2 py-1 rounded">{c}</span>)}
              </div>
              <p className="mt-1 text-blue-500">* = bắt buộc · SỐ LƯỢNG mặc định = 0 nếu để trống</p>
            </div>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /><span className="font-bold text-slate-900">{fileName}</span></div>
              <div className="flex gap-3 text-xs">
                <span className="px-2 py-1 bg-slate-100 rounded-full font-bold text-slate-600">{previewRows.length} dòng</span>
                <span className="px-2 py-1 bg-emerald-100 rounded-full font-bold text-emerald-700">{totalItems.toLocaleString()} sản phẩm</span>
              </div>
            </div>
            <ExcelPreviewTable rows={previewRows} formatNoteValue={formatNoteValue} />
            {previewRows.length >= 100 && (
              <div className="px-3 py-2 bg-amber-50 text-xs text-amber-700 font-medium text-center rounded-b-xl border border-t-0 border-slate-200">Hiển thị tối đa 100 dòng đầu tiên</div>
            )}
            <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${quickImport ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-400/30' : 'border-slate-200 bg-white hover:border-slate-300'}`} onClick={() => setQuickImport(!quickImport)}>
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${quickImport ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-bold ${quickImport ? 'text-emerald-700' : 'text-slate-600'}`}>Nhập kho nhanh</span>
              </div>
              <p className={`text-[10px] mt-1 ${quickImport ? 'text-emerald-600' : 'text-slate-400'}`}>Bỏ qua bước scan QR — sản phẩm vào kho ngay lập tức</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleReset} className="text-sm">← Chọn file khác</Button>
              <Button onClick={handleImport} disabled={importing} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm gap-2">
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang import...</> : <><Upload className="w-4 h-4" /> Import {previewRows.length} dòng ({totalItems.toLocaleString()} mã QR)</>}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Result */}
        {step === 'result' && result && <ExcelImportResult result={result} onReset={handleReset} />}
      </div>
    </Card>
  );
};

export default ExcelImportPanel;
