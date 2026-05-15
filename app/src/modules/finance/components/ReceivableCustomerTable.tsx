import React from 'react';
import { AlertTriangle, Clock, XCircle, CreditCard, Shield, ShieldAlert } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatCurrency } from '../../../utils/format';
import type { Receivable } from '../services/finance.service';

interface CustomerGroup {
  name: string;
  amount: number;
  count: number;
  oldest: Date;
  creditLimit: number;
  creditDays: number;
  orders: Receivable[];
}

interface ReceivableCustomerTableProps {
  byCustomer: CustomerGroup[];
  now: Date;
  totalUnpaid: number;
  onSetPaymentOrder: (order: Receivable) => void;
}

const ReceivableCustomerTable: React.FC<ReceivableCustomerTableProps> = ({ byCustomer, now, totalUnpaid, onSetPaymentOrder }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Công nợ theo khách hàng</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-amber-50 text-amber-800 font-bold text-xs uppercase">
            <tr>
              <th className="p-3">Khách hàng</th>
              <th className="p-3 text-center">Số đơn</th>
              <th className="p-3 text-right">Công nợ</th>
              <th className="p-3 text-right">Hạn mức</th>
              <th className="p-3">Đơn cũ nhất</th>
              <th className="p-3">Tình trạng</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {byCustomer.length === 0
              ? <tr><td colSpan={7} className="p-8 text-center text-gray-400 italic">🎉 Không có công nợ!</td></tr>
              : byCustomer.map((c, i) => {
                  const days = Math.floor((now.getTime() - c.oldest.getTime()) / 86400000);
                  const isOverLimit = c.creditLimit > 0 && c.amount > c.creditLimit;
                  return (
                    <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          {c.name}
                          {isOverLimit && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded-full">
                              <ShieldAlert size={10} /> Vượt hạn mức
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">{c.count}</td>
                      <td className="p-3 text-right font-bold text-amber-600">{formatCurrency(c.amount)}</td>
                      <td className="p-3 text-right text-xs">
                        {c.creditLimit > 0 ? (
                          <span className="flex items-center gap-1 justify-end">
                            <Shield size={10} className={isOverLimit ? 'text-red-500' : 'text-green-500'} />
                            {formatCurrency(c.creditLimit)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Không giới hạn</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-slate-500">{c.oldest.toLocaleDateString('vi-VN')}</td>
                      <td className="p-3">
                        {days > 60 ? <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Quá hạn</span>
                          : days > 30 ? <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><AlertTriangle className="w-3 h-3" /> Cảnh báo</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Bình thường</span>}
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => onSetPaymentOrder(c.orders[0])}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold hover:bg-green-700 transition-colors">
                          <CreditCard size={10} /> Ghi nhận TT
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-4 border-t flex justify-between text-sm font-bold">
        <span className="text-amber-700">Tổng công nợ:</span>
        <span className="text-amber-600 text-lg">{formatCurrency(totalUnpaid)}</span>
      </div>
    </Card>
  );
};

export default ReceivableCustomerTable;
