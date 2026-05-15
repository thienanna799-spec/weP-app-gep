/**
 * CustomerExcelImport – Modal panel for bulk importing customers via Excel/CSV
 * Result display extracted to CustomerImportResult component.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  FileSpreadsheet, Download, Upload, CheckCircle2,
  AlertTriangle, XCircle, Loader2, X, RefreshCw, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import Modal from '../../../components/ui/Modal';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { customerService } from '../services/customer.service';
import CustomerImportResult from './CustomerImportResult';
import CustomerImportDropzone from './CustomerImportDropzone';
import CustomerImportPreviewTable, { PreviewRow } from './CustomerImportPreviewTable';
import { getVal } from '../utils/customerImportColumns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Phase = 'upload' | 'preview' | 'importing' | 'result';



interface ImportResult {
  summary: { totalRows: number; created: number; updated: number; failed: number };
  errors: { row: number; message: string }[];
}

const CustomerExcelImport: React.FC<Props> = ({ isOpen, onClose, onImported }) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [fileBase64, setFileBase64] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setPhase('upload'); setFileName(''); setPreviewRows([]); setFileBase64(''); setResult(null); };
  const handleClose = () => { reset(); onClose(); };

  const processFile = useCallback((file: File) => {
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          alert(t('inventory.excel_import.file_empty'));
          return;
        }

        // Store base64 for server submission
        const base64Reader = new FileReader();
        base64Reader.onload = (ev) => {
          const b64 = (ev.target!.result as string).split(',')[1];
          setFileBase64(b64);
        };
        base64Reader.readAsDataURL(file);

        // Client-side preview with validation
        const seenCodes = new Set<string>();
        const preview: PreviewRow[] = rows.slice(0, 200).map((row, idx) => {
          const code = getVal(row, 'code');
          const name = getVal(row, 'name');
          const phone = getVal(row, 'phone').replace(/[\s\-\.\(\)]/g, '');
          const groupName = getVal(row, 'groupName');
          const platform = getVal(row, 'platform');
          const status = getVal(row, 'status');
          const boss = getVal(row, 'boss');

          let valid = true;
          let error = '';

          if (!code) { valid = false; error = 'Missing code'; }
          else if (seenCodes.has(code.toUpperCase())) { valid = false; error = 'Duplicate code'; }

          if (code) seenCodes.add(code.toUpperCase());

          return { rowNum: idx + 2, code, name, phone, groupName, platform, status, boss, valid, error };
        });

        setPreviewRows(preview);
        setPhase('preview');
      } catch {
        alert(t('inventory.excel_import.file_invalid'));
      }
    };
    reader.readAsArrayBuffer(file);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!fileBase64) return;
    setPhase('importing');
    try {
      const data = await customerService.importExcel(fileBase64);
      setResult(data);
      setPhase('result');
      if (data.summary.created > 0 || data.summary.updated > 0) {
        onImported();
      }
    } catch (err: any) {
      alert('Import error: ' + (err.message || 'Unknown error'));
      setPhase('preview');
    }
  };

  const handleDownloadTemplate = async () => {
    try { await customerService.downloadTemplate(); }
    catch { alert('Error downloading template'); }
  };

  const validCount = previewRows.filter(r => r.valid).length;
  const invalidCount = previewRows.filter(r => !r.valid).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('customers.excel_import.title')} size="lg">
      <div className="space-y-6">

        {/* ── UPLOAD PHASE ─────────────────────────────────── */}
        {phase === 'upload' && (
          <CustomerImportDropzone
            handleDownloadTemplate={handleDownloadTemplate}
            dragOver={dragOver}
            setDragOver={setDragOver}
            handleDrop={handleDrop}
            inputRef={inputRef}
            handleFileSelect={handleFileSelect}
          />
        )}

        {/* ── PREVIEW PHASE ────────────────────────────────── */}
        {phase === 'preview' && (
          <CustomerImportPreviewTable
            fileName={fileName}
            previewRows={previewRows}
            validCount={validCount}
            invalidCount={invalidCount}
            reset={reset}
            handleImport={handleImport}
          />
        )}

        {/* ── IMPORTING PHASE ──────────────────────────────── */}
        {phase === 'importing' && (
          <div className="py-16 text-center">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin mb-4" />
            <p className="font-bold text-slate-900">{t('inventory.excel_import.importing')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('customers.excel_import.importing_desc')}</p>
          </div>
        )}

        {/* ── RESULT PHASE ─────────────────────────────────── */}
        {phase === 'result' && result && (
          <CustomerImportResult result={result} onReset={reset} onClose={handleClose} />
        )}
      </div>
    </Modal>
  );
};

export default CustomerExcelImport;
