import React from 'react';
import { InvoiceData } from '../services/invoice.service';

interface InvoiceProductTableProps {
  invoiceData: InvoiceData;
  formatVND: (n: number) => string;
}

export const InvoiceProductTable: React.FC<InvoiceProductTableProps> = ({ invoiceData, formatVND }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200">
    <table className="w-full text-left">
      <thead>
        <tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <th className="px-3 py-2.5 text-center w-10">#</th>
          <th className="px-3 py-2.5">Sản phẩm</th>
          <th className="px-3 py-2.5 text-center w-16">SL</th>
          <th className="px-3 py-2.5 text-right w-24">Đơn giá</th>
          <th className="px-3 py-2.5 text-right w-24">Thành tiền</th>
          <th className="px-3 py-2.5 w-20">Ghi chú</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {invoiceData.items.length > 0 ? (
          invoiceData.items.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="px-3 py-2 text-center text-xs text-slate-400">{item.no}</td>
              <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.sku || item.productName}</td>
              <td className="px-3 py-2 text-center text-sm">{item.quantity}</td>
              <td className="px-3 py-2 text-right text-xs font-mono text-slate-600">{formatVND(item.unitPrice)}</td>
              <td className="px-3 py-2 text-right text-sm font-bold text-slate-800">{formatVND(item.amount)}</td>
              <td className="px-3 py-2 text-xs text-slate-400">{item.note || ''}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400 italic">
              Chưa có sản phẩm trong đơn hàng
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);
