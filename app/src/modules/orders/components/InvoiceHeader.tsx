import React from 'react';
import { InvoiceData } from '../services/invoice.service';

interface InvoiceHeaderProps {
  invoiceData: InvoiceData;
  getStatusLabel: (status: string) => { label: string; color: string; bg: string };
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ invoiceData, getStatusLabel }) => (
  <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4">
    <div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">DELIVERY RECEIPT</h3>
      <p className="text-xs text-slate-400 font-mono mt-1">{invoiceData.invoiceNumber}</p>
    </div>
    <div className="text-right space-y-1">
      <p className="text-xs text-slate-500">
        <span className="font-bold text-slate-400">Date:</span> {invoiceData.invoiceDate}
      </p>
      <div
        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
        style={{
          background: getStatusLabel(invoiceData.deliveryStatus).bg,
          color: getStatusLabel(invoiceData.deliveryStatus).color,
        }}
      >
        {getStatusLabel(invoiceData.deliveryStatus).label}
      </div>
    </div>
  </div>
);
