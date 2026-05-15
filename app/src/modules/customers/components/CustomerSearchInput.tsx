/**
 * CustomerSearchInput – Reusable autocomplete for orders/shipping
 * ─────────────────────────────────────────────────────────
 * Usage:
 *   <CustomerSearchInput onSelect={(c) => fillForm(c)} />
 *
 * Features:
 *  - Debounced search (300ms)
 *  - Shows dropdown with customer name, phone, code
 *  - Quick-create button if customer doesn't exist
 *  - Auto-focus support for scanner workflows
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Loader2, User } from 'lucide-react';
import Input from '../../../components/ui/Input';
import { useCustomerSearch } from '../hooks/useCustomerSearch';
import { Customer, CUSTOMER_TYPE_LABELS } from '../types';

interface Props {
  onSelect: (customer: Customer) => void;
  onQuickCreate?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  value?: string;
  onChange?: (val: string) => void;
}

const CustomerSearchInput: React.FC<Props> = ({
  onSelect,
  onQuickCreate,
  placeholder = 'Tìm khách hàng (tên, SĐT, mã KH...)',
  autoFocus = false,
  value: externalValue,
  onChange: externalOnChange,
}) => {
  const [inputValue, setInputValue] = useState(externalValue || '');
  const { results, isSearching, isOpen, search, close } = useCustomerSearch();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync with external value
  useEffect(() => {
    if (externalValue !== undefined) setInputValue(externalValue);
  }, [externalValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  const handleChange = (val: string) => {
    setInputValue(val);
    externalOnChange?.(val);
    search(val);
  };

  const handleSelect = (customer: Customer) => {
    setInputValue(customer.name);
    externalOnChange?.(customer.name);
    onSelect(customer);
    close();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
        )}
        <Input
          value={inputValue}
          onChange={(e: any) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          autoFocus={autoFocus}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                <p className="text-[10px] text-slate-400">
                  {c.phone} · {c.code} · {CUSTOMER_TYPE_LABELS[c.customerType]}
                </p>
              </div>
              {c.company && (
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{c.company}</span>
              )}
            </button>
          ))}

          {onQuickCreate && (
            <button
              onClick={() => { close(); onQuickCreate(); }}
              className="w-full px-4 py-3 text-left flex items-center gap-2 text-blue-600 hover:bg-blue-50 border-t border-slate-100 font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo khách hàng mới
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchInput;
