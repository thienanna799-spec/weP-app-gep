/**
 * ExcelImportResult — Shows import result with stats and errors
 */

import React from 'react';
import { Table, CheckCircle2, XCircle, ArrowRight, AlertTriangle, Upload } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface ImportResult {
  batchIds: string[];
  summary: { totalRows: number; success: number; failed: number; totalRollsCreated: number };
  errors: { row: number; message: string }[];
}

interface Props {
  result: ImportResult;
  onReset: () => void;
}

const ExcelImportResult: React.FC<Props> = ({ result, onReset }) => (
  <div className="space-y-4">
    {/* Summary Cards */}
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Tổng dòng', value: result.summary.totalRows, color: 'slate', icon: Table },
        { label: 'Thành công', value: result.summary.success, color: 'green', icon: CheckCircle2 },
        { label: 'Thất bại', value: result.summary.failed, color: 'red', icon: XCircle },
        { label: 'Mã QR tạo', value: result.summary.totalRollsCreated, color: 'emerald', icon: ArrowRight },
      ].map((stat, i) => (
        <div key={i} className={`text-center p-3 rounded-xl bg-${stat.color}-50 border border-${stat.color}-100`}>
          <stat.icon className={`w-5 h-5 text-${stat.color}-500 mx-auto mb-1`} />
          <p className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</p>
        </div>
      ))}
    </div>

    {/* Success message */}
    {result.summary.success > 0 && (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <p className="text-sm text-green-700 font-bold">
          Import thành công {result.summary.success} dòng — {result.summary.totalRollsCreated} mã QR đã được tạo
        </p>
      </div>
    )}

    {/* Errors */}
    {result.errors.length > 0 && (
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-red-600 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" /> Dòng lỗi ({result.errors.length})
        </h5>
        <div className="max-h-[200px] overflow-y-auto border border-red-200 rounded-lg divide-y divide-red-100">
          {result.errors.map((err, i) => (
            <div key={i} className="px-3 py-2 flex items-start gap-2 bg-red-50/50 text-xs">
              <span className="font-mono font-bold text-red-500 flex-shrink-0">Dòng {err.row}:</span>
              <span className="text-red-700">{err.message}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="flex gap-2">
      <Button variant="secondary" onClick={onReset} className="text-sm gap-1.5">
        <Upload className="w-4 h-4" /> Import thêm
      </Button>
    </div>
  </div>
);

export default ExcelImportResult;
