/**
 * PricingPopup — Read-only SKU + Price popup for customer table
 * ─────────────────────────────────────────────────────────────
 * Extracted from CustomerTable for maintainability.
 * Anchors to a button element and auto-repositions on scroll/resize.
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Customer, PricingRule } from '../types';

interface PricingPopupProps {
  customer: Customer;
  anchorElement: HTMLElement;
  onClose: () => void;
}

const PricingPopup: React.FC<PricingPopupProps> = ({ customer, anchorElement, onClose }) => {
  const { t } = useTranslation();
  const popupRef = useRef<HTMLDivElement>(null);
  const rules = customer.pricingRules || [];
  const [position, setPosition] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    const updatePosition = () => {
      if (!anchorElement) return;
      const rect = anchorElement.getBoundingClientRect();
      const top = rect.bottom + 8;
      const left = Math.max(12, Math.min(rect.left - 80, window.innerWidth - 340));
      
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        onClose();
        return;
      }
      setPosition({ top, left });
    };

    updatePosition();

    const handler = (e: MouseEvent) => {
      if (anchorElement.contains(e.target as Node)) return;
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchorElement, onClose]);

  const popup = (
    <div
      ref={popupRef}
      className="fixed z-[99999] bg-white rounded-xl shadow-2xl border border-amber-200 w-[320px] max-h-[360px] overflow-hidden"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        <div>
          <p className="text-xs font-black text-amber-900">{customer.name}</p>
          <p className="text-[10px] text-amber-600">{customer.code} · {rules.length} SKU</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-amber-200/50 text-amber-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="max-h-[290px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">SKU</th>
              <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase text-right">{t('common.price')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((pr: PricingRule) => (
              <tr key={pr.id} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-3 py-1.5 text-xs font-mono font-bold text-slate-800">{pr.sku}</td>
                <td className="px-3 py-1.5 text-xs font-bold text-amber-700 text-right">
                  {pr.price.toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return ReactDOM.createPortal(popup, document.body);
};

export default PricingPopup;
