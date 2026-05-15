/**
 * CustomerToolbar — Search, filters, and action buttons for customer page
 * ────────────────────────────────────────────────────────────────────────
 * Extracted from customers/page.tsx for maintainability.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, FileSpreadsheet, DollarSign, Download, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { PLATFORM_OPTIONS } from '../types';
import { customerService } from '../services/customer.service';

interface CustomerToolbarProps {
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  uniqueGroups: string[];
  uniqueBosses: string[];
  onCreateNew: () => void;
  onOpenImport: () => void;
  onOpenPricingImport: () => void;
  onOpenBankAccounts: () => void;
}

const CustomerToolbar: React.FC<CustomerToolbarProps> = ({
  filters, setFilter, uniqueGroups, uniqueBosses,
  onCreateNew, onOpenImport, onOpenPricingImport, onOpenBankAccounts
}) => {
  const { t } = useTranslation();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsActionsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500/20 shrink-0 max-w-[160px] truncate cursor-pointer";

  return (
    <div className="flex flex-row gap-2 items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-[0_0_15px_rgba(0,0,0,0.05)] w-full">
      {/* Search & Filters */}
      <div className="flex flex-1 gap-2 flex-nowrap overflow-x-auto custom-scrollbar items-center pb-1 lg:pb-0">
        <div className="relative min-w-[200px] shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder={t('customers.search_placeholder')} className="pl-10 h-10 w-full" value={filters.search || ''} onChange={(e: any) => setFilter('search', e.target.value)} />
        </div>
        <select value={filters.status || ''} onChange={e => setFilter('status', e.target.value)} className={selectClass}>
          <option value="">{t('common.all_statuses')}</option>
          <option value="active">🟢 {t('customers.active_customers')}</option>
          <option value="inactive">🟡 {t('customers.paused')}</option>
          <option value="stopped">🔴 {t('customers.stopped')}</option>
        </select>
        <select value={filters.platform || ''} onChange={e => setFilter('platform', e.target.value)} className={selectClass}>
          <option value="">{t('customers.all_platforms')}</option>
          {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.group || ''} onChange={e => setFilter('group', e.target.value)} className={selectClass}>
          <option value="">{t('common.all_groups')}</option>
          {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filters.boss || ''} onChange={e => setFilter('boss', e.target.value)} className={selectClass}>
          <option value="">{t('customers.all_boss')}</option>
          {uniqueBosses.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Action Button */}
      <div className="flex shrink-0 relative" ref={dropdownRef}>
        <div className="flex shadow-lg shadow-blue-500/20 rounded-lg">
          <Button onClick={onCreateNew} className="rounded-r-none border-r border-blue-600/50">
            {t('customers.new_customer')}
          </Button>
          <Button onClick={() => setIsActionsOpen(!isActionsOpen)} className="rounded-l-none px-2 bg-blue-600 hover:bg-blue-700 text-white">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {isActionsOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 overflow-hidden">
            <button onClick={() => { setIsActionsOpen(false); onOpenBankAccounts(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium">
              <Building2 className="w-4 h-4 text-blue-600" /> {t('finance.bank_accounts') || 'Tài khoản ngân hàng'}
            </button>
            <div className="h-px bg-slate-100 my-1"></div>
            <button onClick={() => { setIsActionsOpen(false); onOpenImport(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> {t('common.import')} KH
            </button>
            <button onClick={() => { setIsActionsOpen(false); onOpenPricingImport(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium">
              <DollarSign className="w-4 h-4 text-amber-600" /> {t('common.import')} {t('common.price')}
            </button>
            <div className="h-px bg-slate-100 my-1"></div>
            <button onClick={() => { setIsActionsOpen(false); customerService.exportPricing(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium">
              <Download className="w-4 h-4 text-purple-600" /> {t('common.export')} {t('common.price')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerToolbar;
