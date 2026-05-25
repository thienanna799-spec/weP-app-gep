import React from 'react';
import { InvoiceData } from '../services/invoice.service';

interface InvoiceCustomerInfoProps {
  invoiceData: InvoiceData;
}

export const InvoiceCustomerInfo: React.FC<InvoiceCustomerInfoProps> = ({ invoiceData }) => (
  <div className="flex justify-between items-start gap-6">
    <div className="flex items-center pl-24 w-[55%]">
      <img
        src="https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw"
        alt="GEP"
        className="w-full h-32 object-contain object-left"
        onError={(e: any) => { e.target.style.display = 'none'; }}
      />
    </div>
    <div className="w-[45%] bg-slate-50 rounded-xl p-4 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
      <p className="text-sm font-bold text-slate-900">{invoiceData.customerName}</p>
      <p className="text-xs text-slate-500 mt-1">{invoiceData.customerAddress}</p>
      <p className="text-xs text-slate-500 font-mono">{invoiceData.customerPhone}</p>
    </div>
  </div>
);
