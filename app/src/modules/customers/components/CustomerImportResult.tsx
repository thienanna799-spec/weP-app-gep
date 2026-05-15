/**
 * CustomerImportResult — Result display for customer Excel import
 */

import React from 'react';
import { FileSpreadsheet, CheckCircle2, RefreshCw, XCircle, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

interface ImportResult {
  summary: { totalRows: number; created: number; updated: number; failed: number };
  errors: { row: number; message: string }[];
}

interface Props {
  result: ImportResult;
  onReset: () => void;
  onClose: () => void;
}

const CustomerImportResult: React.FC<Props> = ({ result, onReset, onClose }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t('inventory.excel_import.total_rows'), value: result.summary.totalRows, icon: FileSpreadsheet, color: 'slate' },
          { label: t('customers.excel_import.created'), value: result.summary.created, icon: CheckCircle2, color: 'green' },
          { label: t('customers.excel_import.updated'), value: result.summary.updated, icon: RefreshCw, color: 'blue' },
          { label: t('inventory.excel_import.failed'), value: result.summary.failed, icon: XCircle, color: 'red' },
        ].map((s, i) => (
          <Card key={i} className={`p-3 border-l-4 border-${s.color}-400`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
            <p className="text-xl font-black text-slate-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Success message */}
      {(result.summary.created > 0 || result.summary.updated > 0) && (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-900">
              {t('customers.excel_import.success_msg', { created: result.summary.created, updated: result.summary.updated })}
            </p>
          </div>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-red-600 uppercase">{t('inventory.excel_import.row_errors')} ({result.errors.length})</p>
          <div className="max-h-[200px] overflow-auto rounded-lg bg-red-50/50 border border-red-100 p-3 space-y-1">
            {result.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge variant="red" className="shrink-0">{t('inventory.excel_import.row_label', { num: err.row })}</Badge>
                <span className="text-red-700">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <Button variant="secondary" onClick={onReset} className="gap-2 flex-1">
          <Upload className="w-4 h-4" />{t('inventory.excel_import.import_more')}
        </Button>
        <Button onClick={onClose} className="flex-1">{t('common.close')}</Button>
      </div>
    </>
  );
};

export default CustomerImportResult;
