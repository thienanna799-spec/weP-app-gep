import React from 'react';
import { Download, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';

interface Props {
  handleDownloadTemplate: () => void;
  dragOver: boolean;
  setDragOver: (val: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomerImportDropzone: React.FC<Props> = ({
  handleDownloadTemplate, dragOver, setDragOver, handleDrop, inputRef, handleFileSelect
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Template Download */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div>
          <p className="text-sm font-bold text-blue-900">{t('customers.excel_import.template_info')}</p>
          <p className="text-xs text-blue-600 mt-0.5">{t('customers.excel_import.template_desc')}</p>
        </div>
        <Button variant="secondary" onClick={handleDownloadTemplate} className="gap-2 text-blue-700 border-blue-200 hover:bg-blue-100">
          <Download className="w-4 h-4" />{t('inventory.excel_import.download_template')}
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${dragOver ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/20'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-blue-500' : 'text-slate-300'}`} />
        <p className="font-bold text-slate-700">{t('inventory.excel_import.drag_or_click')}</p>
        <p className="text-xs text-slate-400 mt-2">{t('customers.excel_import.supported_formats')}</p>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Column info */}
      <div className="p-4 bg-slate-50 rounded-xl">
        <p className="text-xs font-bold text-slate-500 uppercase mb-2">{t('customers.excel_import.columns_accepted')}</p>
        <div className="flex flex-wrap gap-2">
          {['CUSTOMER CODE *', 'CUSTOMER NAME *', 'Phone number', 'ADDRESS', 'GROUP NAME', 'OPERATING PLATFORM', 'CUSTOMER CHARACTERISTICS', 'GIP code', 'PRODUCT', 'OPERATIONAL STATUS', 'BOSS', 'NOTE', 'DATE OF ORIGIN'].map(col => (
            <span key={col} className={`text-[11px] px-2 py-1 rounded-lg font-mono ${col.includes('*') ? 'bg-rose-50 text-rose-700 font-bold' : 'bg-white text-slate-600 border border-slate-100'}`}>
              {col}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">* = {t('inventory.excel_import.required_mark')} · Import sẽ tự động cập nhật nếu CUSTOMER CODE đã tồn tại</p>
      </div>
    </>
  );
};

export default CustomerImportDropzone;
