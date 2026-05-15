/**
 * CustomerTable – CRM data table with SKU pricing popup
 * ─────────────────────────────────────────────────────────
 * Click "8 SKU" → simple popup showing SKU + Price only.
 * Editing is done in the CustomerForm (edit modal).
 * PricingPopup extracted to PricingPopup.tsx
 */

import React, { useState } from 'react';
import { Phone, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { Customer, OPERATIONAL_STATUS_LABELS, OPERATIONAL_STATUS_COLORS } from '../types';
import PricingPopup from './PricingPopup';

interface Props {
  customers: Customer[];
  loading: boolean;
  onView: (c: Customer) => void;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
}

/* ── Main Table ─────────────────────────────────────────── */
const CustomerTable: React.FC<Props> = ({ customers, loading, onView, onEdit, onDelete, onRefresh, selectedIds = [], onSelect }) => {
  const { t } = useTranslation();
  const [pricingPopup, setPricingPopup] = useState<{ customer: Customer; element: HTMLElement } | null>(null);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      </Card>
    );
  }

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN');
  };

  const handlePricingClick = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation();
    const element = e.currentTarget as HTMLElement;
    setPricingPopup(prev => prev?.customer.id === c.id ? null : { customer: c, element });
  };

  return (
    <>
      <Card className="overflow-hidden border border-slate-200">
        <div className="overflow-auto max-h-[calc(100vh-110px)] custom-scrollbar relative">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 z-20 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    onChange={(e) => {
                      if (e.target.checked) onSelect?.(customers.map(c => c.id));
                      else onSelect?.([]);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.code')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.name')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.phone')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.price')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('customers.group')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('customers.platform')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.status')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">Boss</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('common.created_at')}</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-500 uppercase">{t('orders.title')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-400 italic">{t('customers.no_customers')}</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className={`relative transition-all duration-200 ${selectedIds.includes(c.id) ? 'bg-blue-50/80 hover:bg-blue-100 hover:shadow-md hover:z-10' : 'hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-[1px] hover:z-10'}`}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) onSelect?.([...selectedIds, c.id]);
                        else onSelect?.(selectedIds.filter(id => id !== c.id));
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onView(c)}
                      className="text-xs font-mono font-bold text-slate-700 hover:text-blue-600 underline decoration-transparent hover:decoration-blue-300 underline-offset-2 transition-colors cursor-pointer"
                      title={t('common.detail')}
                    >
                      {c.code}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 group/link max-w-[220px]">
                      <button
                        onClick={() => onEdit(c)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 truncate underline decoration-transparent hover:decoration-blue-300 underline-offset-2 transition-colors cursor-pointer text-left flex-1"
                        title={`${t('common.edit')}: ${c.name}${c.recipientName && c.recipientName !== c.name ? ` (→ ${c.recipientName})` : ''}`}
                      >
                        {c.name}
                        {c.recipientName && c.recipientName !== c.name && (
                           <span className="text-[10px] text-slate-400 font-normal ml-1.5 inline">→ {c.recipientName}</span>
                        )}
                      </button>
                      {c.groupChatLink && (
                        <a
                          href={c.groupChatLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0"
                          title={`Mở nhóm: ${c.groupName || c.name}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    {(c.pricingRules?.length || 0) > 0 ? (
                      <button
                        onClick={(e) => handlePricingClick(e, c)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer border
                          ${pricingPopup?.customer.id === c.id
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                            : 'bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100 hover:shadow-sm'
                          }`}
                      >
                        {c.pricingRules!.length} SKU
                      </button>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.groupName ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium block max-w-[120px] truncate text-center" title={c.groupName}>{c.groupName}</span>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.operatingPlatform ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium block max-w-[100px] truncate text-center" title={c.operatingPlatform}>{c.operatingPlatform}</span>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="inline-flex max-w-[110px]">
                      <Badge variant={OPERATIONAL_STATUS_COLORS[c.operationalStatus || 'active'] as any} className="truncate">
                        {OPERATIONAL_STATUS_LABELS[c.operationalStatus || 'active']}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-slate-600 block max-w-[100px] truncate" title={c.boss || ''}>{c.boss || '—'}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs text-slate-500">{formatDate(c.dateOfOrigin || c.createdAt)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-sm font-bold text-slate-700">{c._count?.orders || c.totalOrders}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pricingPopup && (
        <PricingPopup
          customer={pricingPopup.customer}
          anchorElement={pricingPopup.element}
          onClose={() => setPricingPopup(null)}
        />
      )}
    </>
  );
};

export default CustomerTable;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              /**
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
          <RefreshCw className="w-3 h-3 animate-spin" 