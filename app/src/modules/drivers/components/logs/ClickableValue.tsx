/**
 * ClickableValue — Used in LogsTableRow to display a value that can be clicked to open a photo
 */
import React from 'react';
import { Camera, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../../../utils/format';
import { OcrAuditSummary } from './LogsTypes';

interface ClickableValueProps {
  value: string | number | null;
  photo: string | null;
  format?: 'km' | 'currency' | 'price';
  onViewPhoto: (src: string, alt: string) => void;
  label: string;
  audit?: OcrAuditSummary;
}

const ClickableValue: React.FC<ClickableValueProps> = ({ value, photo, format, onViewPhoto, label, audit }) => {
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>;

  let displayValue: string;
  switch (format) {
    case 'km':
      displayValue = Number(value).toLocaleString('vi-VN');
      break;
    case 'currency':
      displayValue = formatCurrency(Number(value));
      break;
    case 'price':
      displayValue = `${Number(value).toLocaleString('vi-VN')}`;
      break;
    default:
      displayValue = String(value);
  }

  let ocrWarning = null;
  if (audit) {
    const hasError = audit.reviewStatus === 'rejected' || (audit.differenceValue !== null && Math.abs(audit.differenceValue) > 0) || audit.riskLevel === 'high';
    if (hasError) {
      const tooltip = audit.fraudReason ? `OCR Cảnh báo: ${audit.fraudReason}` : 'OCR Cảnh báo: Dữ liệu không khớp';
      ocrWarning = (
        <span className="inline-flex items-center ml-1 text-red-500" title={tooltip}>
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        </span>
      );
    } else if (audit.pipelineStatus !== 'audited' && audit.pipelineStatus !== 'failed' && audit.pipelineStatus !== 'queued') {
      ocrWarning = (
        <span className="inline-flex items-center ml-1 text-blue-400" title="OCR Đang quét...">
          <RefreshCw className="w-3 h-3 animate-spin" />
        </span>
      );
    }
  }

  if (photo) {
    return (
      <div className="inline-flex items-center justify-end gap-1 w-full">
        <button
          onClick={() => onViewPhoto(photo, label)}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-colors group"
          title="Click để xem ảnh chứng từ"
        >
          <span className="group-hover:underline">{displayValue}</span>
          <Camera className="w-3 h-3 opacity-50 group-hover:opacity-100" />
        </button>
        {ocrWarning}
      </div>
    );
  }

  // No photo — show warning for KM values
  if (format === 'km' || format === 'currency') {
    return (
      <div className="inline-flex items-center justify-end gap-1 w-full">
        <span className="font-semibold text-slate-700 inline-flex items-center gap-1" title="Chưa có ảnh chứng từ">
          {displayValue}
          <AlertTriangle className="w-3 h-3 text-amber-400" />
        </span>
        {ocrWarning}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-end gap-1 w-full">
      <span className="font-semibold text-slate-700">{displayValue}</span>
      {ocrWarning}
    </div>
  );
};

export default ClickableValue;
