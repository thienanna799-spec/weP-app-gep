import React from 'react';
import { FileSpreadsheet, RefreshCw, CheckCircle2, Upload } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface PreviewRow {
  rowNum: number;
  customerCode: string;
  customerName: string;
  sku: string;
  price: string;
  valid: boolean;
  error?: string;
}

interface PricingImportPreviewTableProps {
  fileName: string;
  previewRows: PreviewRow[];
  validCount: number;
  invalidCount: number;
  onReset: () => void;
  onImport: () => void;
}

export default function PricingImportPreviewTable({
  fileName,
  previewRows,
  validCount,
  invalidCount,
  onReset,
  onImport
}: PricingImportPreviewTableProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-slate-900">{fileName}</p>
            <p className="text-xs text-slate-500">
              {previewRows.length} dòng · <span className="text-green-600">{validCount} OK</span> · <span className="text-red-500">{invalidCount} lỗi</span>
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onReset} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Chọn file khác
        </Button>
      </div>

      <div className="max-h-[350px] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">
              <th className="px-3 py-2.5 w-10">#</th>
              <th className="px-3 py-2.5">Mã KH</th>
              <th className="px-3 py-2.5">Tên KH</th>
              <th className="px-3 py-2.5">SKU</th>
              <th className="px-3 py-2.5 text-right">Giá bán</th>
              <th className="px-3 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {previewRows.map(row => (
              <tr key={row.rowNum} className={row.valid ? 'bg-white' : 'bg-red-50/50'}>
                <td className="px-3 py-2 text-[11px] font-mono text-slate-400">{row.rowNum}</td>
                <td className="px-3 py-2 font-mono text-xs font-bold text-blue-600">{row.customerCode || '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-700 truncate max-w-[140px]">{row.customerName || '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-600">{row.sku || '—'}</td>
                <td className="px-3 py-2 text-xs text-right font-bold text-slate-900">
                  {row.price ? Number(row.price.replace(/[,\s]/g, '')).toLocaleString('vi-VN') : '—'}
                </td>
                <td className="px-3 py-2 text-center">
                  {row.valid
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                    : <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{row.error}</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">SKU đã tồn tại → cập nhật giá · SKU mới → thêm vào bảng giá</p>
        <Button
          onClick={onImport}
          disabled={validCount === 0}
          className="gap-2 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200 px-6"
        >
          <Upload className="w-4 h-4" />
          Import {validCount} dòng giá
        </Button>
      </div>
    </>
  );
}
