import React from 'react';
import { InvoiceData } from '../services/invoice.service';

interface InvoiceTotalsProps {
  invoiceData: InvoiceData;
  formatVND: (n: number) => string;
}

export const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({ invoiceData, formatVND }) => (
  <div className="flex justify-end">
    <div className="w-64 space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Tạm tính</span>
        <span className="font-mono text-slate-700">{formatVND(invoiceData.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">VAT ({invoiceData.vatPercent}%)</span>
        <span className="font-mono text-slate-700">{formatVND(invoiceData.vatAmount)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Phí vận chuyển</span>
        <span className="font-mono text-slate-700">{formatVND(invoiceData.shippingFee)}</span>
      </div>
      <div className="h-px bg-slate-200 my-1" />
      <div className="flex justify-between text-base pt-1">
        <span className="font-bold text-slate-800">Tổng cộng</span>
        <span className="font-black text-blue-700 font-mono">{formatVND(invoiceData.totalPrice)}</span>
      </div>
    </div>
  </div>
);
