import React from 'react';
import { FileSpreadsheet, RefreshCw, CheckCircle2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';

export interface PreviewRow {
  rowNum: number;
  code: string;
  name: string;
  phone: string;
  groupName: string;
  platform: string;
  status: string;
  boss: string;
  valid: boolean;
  error?: string;
}

interface Props {
  fileName: string;
  previewRows: PreviewRow[];
  validCount: number;
  invalidCount: number;
  reset: () => void;
  handleImport: () => void;
}

const CustomerImportPreviewTable: React.FC<Props> = ({
  fileName, previewRows, validCount, invalidCount, reset, handleImport
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-bold text-slate-900">{fileName}</p>
            <p className="text-xs text-slate-500">{previewRows.length} {t('common.rows')} · <span className="text-green-600">{validCount} OK</span> · <span className="text-red-500">{invalidCount} {t('common.error').toLowerCase()}</span></p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={reset} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />{t('inventory.excel_import.choose_other')}
        </Button>
      </div>

      {/* Preview Table */}
      <div className="max-h-[380px] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">
              <th className="px-3 py-2.5 w-10">#</th>
              <th className="px-3 py-2.5">Mã KH</th>
              <th className="px-3 py-2.5">{t('common.name')}</th>
              <th className="px-3 py-2.5">{t('common.phone')}</th>
              <th className="px-3 py-2.5">Nhóm</th>
              <th className="px-3 py-2.5">Nền tảng</th>
              <th className="px-3 py-2.5">Boss</th>
              <th className="px-3 py-2.5 text-center">{t('common.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {previewRows.map(row => (
              <tr key={row.rowNum} className={`${row.valid ? 'bg-white' : 'bg-red-50/50'}`}>
                <td className="px-3 py-2 text-[11px] font-mono text-slate-400">{row.rowNum}</td>
                <td className="px-3 py-2 font-mono text-xs font-bold text-blue-600">{row.code || <span className="text-red-400 italic">—</span>}</td>
                <td className="px-3 py-2 font-medium text-slate-900 truncate max-w-[150px]">{row.name || '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.phone || '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{row.groupName || '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{row.platform || '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{row.boss || '—'}</td>
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

      {/* Import Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {t('customers.excel_import.upsert_note')}
        </p>
        <Button
          onClick={handleImport}
          disabled={validCount === 0}
          className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 px-6"
        >
          <Upload className="w-4 h-4" />
          {t('customers.excel_import.import_btn', { count: validCount })}
        </Button>
      </div>
    </>
  );
};

export default CustomerImportPreviewTable;
